import collections

def get_chrf_score(reference: str, hypothesis: str, n_gram_order: int = 6, beta: float = 2.0) -> float:
    """
    Computes the Character n-gram F-score (chrF).
    Based on the SLP3 textbook Ch 12 implementation details.
    chrF is particularly effective for morphologically rich languages.
    """
    def get_char_ngrams(text: str, n: int):
        return [text[i:i+n] for i in range(len(text)-n+1)]

    if not reference or not hypothesis:
        return 0.0

    ref_ngrams = []
    hyp_ngrams = []
    
    for n in range(1, n_gram_order + 1):
        ref_ngrams.extend(get_char_ngrams(reference, n))
        hyp_ngrams.extend(get_char_ngrams(hypothesis, n))

    if not ref_ngrams or not hyp_ngrams:
        return 0.0

    ref_counts = collections.Counter(ref_ngrams)
    hyp_counts = collections.Counter(hyp_ngrams)
    
    matched_ngrams = 0
    for ngram, count in hyp_counts.items():
        matched_ngrams += min(count, ref_counts.get(ngram, 0))
    
    precision = matched_ngrams / len(hyp_ngrams) if hyp_ngrams else 0
    recall = matched_ngrams / len(ref_ngrams) if ref_ngrams else 0
    
    if (beta**2 * precision) + recall == 0:
        return 0.0
        
    f_score = (1 + beta**2) * (precision * recall) / ((beta**2 * precision) + recall)
    return f_score
