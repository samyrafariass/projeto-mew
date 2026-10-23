#pragma once

// A mesma função é compilada para o executável nativo e para WebAssembly.
// Retorna -1 quando um vetor ou parâmetro não pertence ao intervalo permitido.
extern "C" double mew_score(const double* weakness, const double* features,
                            int dimensions, double fit, double novelty);
