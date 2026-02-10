#ifndef RISK_MANAGER_H
#define RISK_MANAGER_H

extern int risk_score;
extern int mmap_count;

void init_risk_manager(void);
void add_risk(int points);
int get_risk_score(void);
void increment_mmap_count(void);
int get_mmap_count(void);

#endif

