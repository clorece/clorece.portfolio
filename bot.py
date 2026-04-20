import os
import discord
from discord.ext import commands
from discord import app_commands
from dotenv import load_dotenv
import asyncio

import database
import ml_assistant

load_dotenv()

intents = discord.Intents.default()
intents.message_content = True
bot = commands.Bot(command_prefix="!", intents=intents)

# Track active sessions to prevent users from starting multiple practice/daily sessions
active_sessions = set()

class ChallengeView(discord.ui.View):
    def __init__(self, user_id):
        super().__init__(timeout=60.0)
        self.user_id = user_id
        self.choice = None

    @discord.ui.button(label="Word Challenge", style=discord.ButtonStyle.primary)
    async def word_button(self, interaction: discord.Interaction, button: discord.ui.Button):
        if interaction.user.id != self.user_id:
            await interaction.response.send_message("This choice is not for you!", ephemeral=True)
            return
        self.choice = "Word"
        await interaction.response.defer()
        self.stop()

    @discord.ui.button(label="Sentence Challenge", style=discord.ButtonStyle.secondary)
    async def sentence_button(self, interaction: discord.Interaction, button: discord.ui.Button):
        if interaction.user.id != self.user_id:
            await interaction.response.send_message("This choice is not for you!", ephemeral=True)
            return
        self.choice = "Sentence"
        await interaction.response.defer()
        self.stop()

@bot.event
async def on_ready():
    print(f"Logged in as {bot.user.name}")
    try:
        # Load ML model in the background so it's ready
        print("Warming up ML model...")
        ml_assistant.get_model()
        print("ML model ready.")
        
        synced = await bot.tree.sync()
        print(f"Synced {len(synced)} command(s)")
    except Exception as e:
        print(e)


@bot.tree.command(name="help", description="Shows how to use Langy")
async def help_cmd(interaction: discord.Interaction):
    embed = discord.Embed(
        title="Langy - Language Learning Bot",
        description="I am an interactive language learning bot that uses semantic Machine Learning to test your translation skills and track your daily practice! Here are my commands:",
        color=discord.Color.blue()
    )
    embed.add_field(name="/practice <language> [word_or_sentence]", value="Practice a language (Translating native to English). Doesn't affect streak.", inline=False)
    embed.add_field(name="/inverse <language> [word_or_sentence]", value="Practice translating English directly to a target language.", inline=False)
    embed.add_field(name="/daily <language> [word_or_sentence]", value="Test your skills once a day to build a streak! (Translating native to English).", inline=False)
    embed.add_field(name="/rank", value="View the server's top streaks.", inline=False)
    embed.add_field(name="/language", value="View supported languages.", inline=False)
    
    await interaction.response.send_message(embed=embed)


@bot.tree.command(name="language", description="Shows supported languages")
async def language_cmd(interaction: discord.Interaction):
    langs = sorted([l.capitalize() for l in ml_assistant.SUPPORTED_LANGUAGES])
    lang_str = ", ".join(langs)
    
    if len(lang_str) > 4000:
        lang_str = lang_str[:4000] + "..."

    embed = discord.Embed(
        title="Supported Languages",
        description=f"Langy supports {len(langs)} languages! Ensure your requested language perfectly matches one of these:\n\n{lang_str}",
        color=discord.Color.green()
    )
    await interaction.response.send_message(embed=embed)


@bot.tree.command(name="rank", description="Shows the server's top scores")
async def rank_cmd(interaction: discord.Interaction):
    leaderboard = database.get_leaderboard(10)
    
    if not leaderboard:
        await interaction.response.send_message("Nobody has any points yet! Be the first by using `/daily`.")
        return
        
    embed = discord.Embed(title="[RANKINGS] Global Leaderboard", color=discord.Color.orange())
    
    desc = ""
    for idx, entry in enumerate(leaderboard, 1):
        user_id_str, points, streak_raw, username, avatar, last_date = entry
        streak = database.evaluate_multiplier(streak_raw, last_date)
        desc += f"**{idx}.** <@{user_id_str}> - **{points} Points** (Multiplier: x{streak})\n"
        
    embed.description = desc
    await interaction.response.send_message(embed=embed)


async def execute_challenge(interaction: discord.Interaction, language: str, word: str, is_daily: bool, is_inverse: bool):
    user_id = interaction.user.id
    
    if user_id in active_sessions:
        await interaction.response.send_message("You already have an active challenge! Finish it first.", ephemeral=True)
        return
        
    if is_daily and not database.can_do_daily(str(user_id)):
        # Wait, you only get ONE daily completion.
        await interaction.response.send_message("You've already done your `/daily` challenge today! Use `/practice` if you want to keep playing.", ephemeral=True)
        return

    await interaction.response.defer()
    active_sessions.add(user_id)
    
    try:
        # Pre-Challenge Choice Phase
        view = ChallengeView(user_id)
        if is_daily:
            _, mult, last_date = database.get_user(str(user_id))
            active_mult = database.evaluate_multiplier(mult, last_date)
            w_pts = 15 * active_mult
            s_pts = 30 * active_mult
            desc = f"**Current Active Multiplier: x{active_mult}** (Streak: {mult})\n\n**Word Challenge:** {w_pts} Points\n**Sentence Challenge:** {s_pts} Points\n\n*Select your difficulty using the buttons below!*"
        else:
            desc = "**Word Challenge**\n**Sentence Challenge**\n\n*Select your difficulty using the buttons below!*"
            
        embed_prompt = discord.Embed(title="Choose Challenge", description=desc, color=discord.Color.blue())
        prompt_msg = await interaction.followup.send(embed=embed_prompt, view=view, wait=True)
        
        timed_out = await view.wait() # Returns True if it timed out
        
        if timed_out or not view.choice:
            await interaction.followup.send(f"{interaction.user.mention} You ran out of time to choose! Challenge cancelled.")
            return
            
        category = view.choice
    
        # Generate Challenge
        english_word, translated_word, example_sentence_en, example_sentence_native = await ml_assistant.generate_challenge(language, word, category)
        
        if english_word == "error":
            err = translated_word[:150] + "..." if len(translated_word) > 150 else translated_word
            await interaction.followup.send(f"Sorry, I couldn't set up the challenge! Ensure the language is supported (`/language`). Error: {err}")
            return

        if is_inverse:
            challenge_prompt = ml_assistant.formatPrompt_EngToNative(language, english_word)
        else:
            challenge_prompt = ml_assistant.formatPrompt_NativeToEng(language, translated_word)

        # Add example sentence for Word mode to help disambiguate meanings
        # Standard mode: show target-language sentence (doesn't reveal the English answer)
        # Inverse mode: show English sentence (doesn't reveal the target-language answer)
        example_line = ""
        if category.lower() == "word":
            example = example_sentence_en if is_inverse else example_sentence_native
            if example:
                example_line = f"\n\n💡 **Example:** *{example}*"

        ch_type_str = "Daily" if is_daily else "Practice"
        challenge_embed = discord.Embed(
            title=f"{ch_type_str} {category} ({language.capitalize()})",
            description=f"{challenge_prompt}{example_line}\n\n*(Type your answer in this channel. You have 60 seconds!)*",
            color=discord.Color.purple()
        )
        await interaction.followup.send(content=interaction.user.mention, embed=challenge_embed)
        
        def check_msg(m):
            return m.author.id == user_id and m.channel.id == interaction.channel.id
            
        try:
            msg = await bot.wait_for('message', check=check_msg, timeout=60.0)
        except asyncio.TimeoutError:
            await interaction.followup.send(f"{interaction.user.mention} Time is up! Challenge failed.")
            return

        user_answer = msg.content
        
        async with interaction.channel.typing():
            is_correct, score, reason = await ml_assistant.process_user_input_and_grade(language, english_word, user_answer)
        
        if is_correct:
            if is_daily:
                if database.can_do_daily(str(user_id)):
                    base_points = 15 if category == "Word" else 30
                    earned, total, streak = database.reward_daily(str(user_id), base_points)
                    res_desc = f"**Passed! (Success)**\nAccuracy Score: **{score:.2f}**\nReasoning: {reason}\n\nThe expected answer was **{english_word if not is_inverse else translated_word}**.\n\n**You earned {earned} Points!** (x{streak} streak multiplier)\n**Total Score: {total}**"
                    color = discord.Color.green()
                else:
                    res_desc = f"**Passed! (Success)**\nAccuracy Score: **{score:.2f}**\nReasoning: {reason}\n\nThe expected answer was **{english_word if not is_inverse else translated_word}**.\n\n*Note: You've already completed a daily today, so no additional points were awarded.*"
                    color = discord.Color.blue()
            else:
                res_desc = f"**Passed! (Success)**\nAccuracy Score: **{score:.2f}**\nReasoning: {reason}\n\nThe expected answer was **{english_word if not is_inverse else translated_word}**.\n\n*(This was practice, so points weren't affected.)*"
                color = discord.Color.green()
        else:
            if is_daily:
                if database.can_do_daily(str(user_id)):
                    total, streak = database.fail_daily(str(user_id))
                    res_desc = f"**Incorrect. (Failed)**\nAccuracy Score: **{score:.2f}** (Failed)\nReasoning: {reason}\n\nThe expected answer was **{english_word if not is_inverse else translated_word}**.\n\nYour multiplier streak was reset to x1. Current Total: {total}."
                    color = discord.Color.red()
                else:
                    res_desc = f"**Incorrect. (Failed)**\nAccuracy Score: **{score:.2f}** (Failed)\nReasoning: {reason}\n\nThe expected answer was **{english_word if not is_inverse else translated_word}**.\n\n*Note: You've already completed a daily today, so your streak was not affected.*"
                    color = discord.Color.orange()
            else:
                res_desc = f"**Incorrect. (Failed)**\nAccuracy Score: **{score:.2f}** (Failed)\nReasoning: {reason}\n\nThe expected answer was **{english_word if not is_inverse else translated_word}**."
                color = discord.Color.red()
                
        result_embed = discord.Embed(description=res_desc, color=color)
        await interaction.channel.send(content=interaction.user.mention, embed=result_embed)
        
    finally:
        active_sessions.remove(user_id)


@bot.tree.command(name="practice", description="Practice translating without affecting score.")
@app_commands.describe(language="The language to practice", word="Optional specific word/sentence")
async def practice_cmd(interaction: discord.Interaction, language: str, word: str = None):
    await execute_challenge(interaction, language, word, is_daily=False, is_inverse=False)

@bot.tree.command(name="inverse", description="Practice translating from English to the target language.")
@app_commands.describe(language="The language to practice", word="Optional English word to translate")
async def inverse_cmd(interaction: discord.Interaction, language: str, word: str = None):
    await execute_challenge(interaction, language, word, is_daily=False, is_inverse=True)

@bot.tree.command(name="daily", description="Test your translation skills once a day to earn points!")
@app_commands.describe(language="The language to practice", word="Optional specific word/sentence")
async def daily_cmd(interaction: discord.Interaction, language: str, word: str = None):
    await execute_challenge(interaction, language, word, is_daily=True, is_inverse=False)


async def start_bot():
    token = os.getenv("DISCORD_TOKEN")
    if not token or token == "your_discord_bot_token_here":
        print("Please set your DISCORD_TOKEN in the .env file.")
        return
    
    # Refined Exponential Backoff:
    # 30s -> 1m -> 2m -> 4m -> 8m -> 15m -> 30m
    retry_delay = 30  
    max_delay = 1800  # 30 minutes
    
    while True:
        try:
            print(f"[BOT] Attempting to connect to Discord... (Current Backoff: {retry_delay}s)")
            await bot.start(token)
            # If start() returns successfully, reset the delay for future reconnections
            retry_delay = 30
        except Exception as e:
            print(f"\n[BOT CONNECTION ERROR] {e}")
            
            # Clean up half-open sessions to prevent "Unclosed client session" warnings
            try:
                await bot.close()
            except:
                pass
                
            print(f"Server may be rate-limited or offline. Waiting {retry_delay}s before next attempt...")
            await asyncio.sleep(retry_delay)
            
            # Binary exponential backoff
            retry_delay = min(retry_delay * 2, max_delay)

if __name__ == "__main__":
    asyncio.run(start_bot())
