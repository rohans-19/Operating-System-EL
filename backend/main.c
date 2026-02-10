#define _GNU_SOURCE
#include "child_process.h"
#include "monitor.h"
#include "risk_manager.h"
#include <stdio.h>
#include <stdlib.h>
#include <unistd.h>

int main(int argc, char *argv[]) {
    if (argc < 2) {
        printf("Usage: %s <program>\n", argv[0]);
        return 1;
    }

    init_risk_manager();

    pid_t pid = fork();
    if (pid == 0)
        child(argv[1], &argv[1]);
    else {
        printf("[+] Sandbox started. Monitoring PID %d\n", pid);
        monitor(pid);
    }
    return 0;
}

