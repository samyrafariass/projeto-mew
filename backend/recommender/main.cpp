#include <cmath>
#include <iomanip>
#include <iostream>
#include <vector>
#include "score.hpp"

// Protocolo stdin: dimensões candidatos; vetor de dificuldades por tópico;
// para cada candidato: vetor de conteúdo, ajuste de nível e novidade.
// stdout: uma pontuação por candidato, na mesma ordem. Sem dependências.
int main() {
    int dimensions, candidates;
    if (!(std::cin >> dimensions >> candidates) || dimensions < 1 || dimensions > 100 || candidates < 1 || candidates > 10000) return 1;
    std::vector<double> weakness(dimensions);
    for (double &v : weakness) {
        if (!(std::cin >> v) || !std::isfinite(v) || v < 0 || v > 1) return 1;
    }
    std::cout << std::setprecision(17);
    for (int n = 0; n < candidates; ++n) {
        double fit, novelty;
        std::vector<double> features(dimensions);
        for (int i = 0; i < dimensions; ++i) {
            double &value = features[i];
            if (!(std::cin >> value) || !std::isfinite(value) || value < 0 || value > 1) return 1;
        }
        if (!(std::cin >> fit >> novelty) || !std::isfinite(fit) || !std::isfinite(novelty) || fit < 0 || fit > 1 || novelty < 0 || novelty > 1) return 1;
        const double result = mew_score(weakness.data(), features.data(), dimensions, fit, novelty);
        if (result < 0) return 1;
        std::cout << result << '\n';
    }
}
