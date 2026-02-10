#include "risk_manager.h"

int risk_score = 0;
int mmap_count = 0;

void init_risk_manager(void) {
    risk_score = 0;
    mmap_count = 0;
}

void add_risk(int points) {
    risk_score += points;
}

int get_risk_score(void) {
    return risk_score;
}

void increment_mmap_count(void) {
    mmap_count++;
}

int get_mmap_count(void) {
    return mmap_count;
}

