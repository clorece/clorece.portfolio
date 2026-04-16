import ml_assistant
import accuracy

def test_case(original, user_input, category):
    is_correct, score, reason = ml_assistant.process_user_input_and_grade("spanish", original, user_input, category)
    print(f"[{category}] '{user_input}' vs '{original}'")
    print(f"Result: {'Correct' if is_correct else 'Incorrect'} | Score: {score}")
    print(f"Reason: {reason}")
    print("-" * 30)

if __name__ == "__main__":
    # Pre-load model to avoid lag in output
    accuracy.get_model()
    
    print("--- VERIFYING GRADING FIXES ---\n")
    
    # Case 1: Missing 'me' in sentence
    test_case("please pass me the sugar.", "Please pass the sugar", "sentence")
    
    # Case 2: Idiomatic translation
    test_case("great talkers are little doers.", "People who speak well tend to lack the drive to take action.", "sentence")
    
    # Case 3: Synonyms in sentence
    test_case("haste makes waste.", "Haste creates waste.", "sentence")
    
    # Case 4: Perfect match with casing
    test_case("the journey of a thousand miles begins with a single step.", "A journey of a thousand miles begins with a single step.", "sentence")
