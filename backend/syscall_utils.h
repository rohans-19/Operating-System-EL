#ifndef SYSCALL_UTILS_H
#define SYSCALL_UTILS_H

#include <sys/types.h>

const char *syscall_name(long sc);
void read_child_string(pid_t pid, unsigned long addr, char *buf);

#endif

