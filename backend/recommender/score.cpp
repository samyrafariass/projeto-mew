#include "score.hpp"
#ifndef __wasm__
#include <cmath>
#endif

extern "C" double mew_score(const double* weakness, const double* features,
                            int dimensions, double fit, double novelty) {
    if (!weakness || !features || dimensions < 1 || dimensions > 100 ||
        !(fit >= 0 && fit <= 1) || !(novelty >= 0 && novelty <= 1)) return -1;
    double dot = 0, normA = 0, normB = 0;
    for (int i = 0; i < dimensions; ++i) {
        const double a = weakness[i], b = features[i];
        if (!(a >= 0 && a <= 1) || !(b >= 0 && b <= 1)) return -1;
        dot += a * b;
        normA += a * a;
        normB += b * b;
    }
#ifdef __wasm__
    const double norm = __builtin_sqrt(normA * normB);
#else
    const double norm = std::sqrt(normA * normB);
#endif
    return 0.65 * (norm ? dot / norm : 0) + 0.25 * fit + 0.10 * novelty;
}

#ifdef __wasm__
// Memória fixa: dois vetores de até cem doubles, sem alocação ou imports.
static double input_buffer[200];
extern "C" double* mew_input_buffer() { return input_buffer; }
extern "C" int mew_abi_version() { return 1; }
#endif
