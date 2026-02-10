#define _GNU_SOURCE
#include "child_process.h"
#include "seccomp_filter.h"
#include <stdio.h>
#include <stdlib.h>
#include <unistd.h>
#include <signal.h>
#include <sys/ptrace.h>
#include <sys/resource.h>

void child(char *prog, char **args) {
    struct rlimit rl = {2, 2};
    setrlimit(RLIMIT_CPU, &rl);

    rl.rlim_cur = rl.rlim_max = 50 * 1024 * 1024;
    setrlimit(RLIMIT_AS, &rl);

    ptrace(PTRACE_TRACEME, 0, NULL, NULL);
    raise(SIGSTOP);

    apply_seccomp();
    execvp(prog, args);
    perror("execvp");
    exit(1);
}

