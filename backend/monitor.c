#define _GNU_SOURCE
#include "monitor.h"
#include "syscall_utils.h"
#include "path_utils.h"
#include "risk_manager.h"
#include <stdio.h>
#include <signal.h>
#include <sys/ptrace.h>
#include <sys/wait.h>
#include <sys/user.h>
#include <sys/syscall.h>

void monitor(pid_t pid) {
    int status;
    struct user_regs_struct r;

    waitpid(pid, &status, 0);
    ptrace(PTRACE_SETOPTIONS, pid, 0, PTRACE_O_TRACESYSGOOD);
    ptrace(PTRACE_SYSCALL, pid, 0, 0);

    while (1) {
        waitpid(pid, &status, 0);
        
        if (WIFEXITED(status)) {
            printf("\n[RISK SCORE] %d\n",get_risk_score());
            if (get_risk_score() >94)               
            
                printf("[VERDICT] SUSPICIOUS\n");
            else
                printf("[VERDICT] SAFE\n");
            break;
        }

        if (WIFSIGNALED(status)) {
            printf("\n[RISK SCORE] %d\n", get_risk_score());
            printf("[VERDICT] MALICIOUS\n");
            break;
        }

        if (WIFSTOPPED(status)) {
            int sig = WSTOPSIG(status);

            if (sig == (SIGTRAP | 0x80)) {
                ptrace(PTRACE_GETREGS, pid, 0, &r);
                long sc = r.orig_rax;

                printf("[SYSCALL] %ld (%s)\n", sc, syscall_name(sc));

                if (sc == __NR_openat) {
                    add_risk(2);
                    char path[256];
                    read_child_string(pid, r.rsi, path);

                    if (is_sensitive(path)) {
                        add_risk(50);
                        printf("\n[POLICY] Sensitive file blocked: %s\n", path);
                        printf("\n[RISK SCORE] %d\n", get_risk_score());
                        printf("[VERDICT] SUSPICIOUS\n");
                        ptrace(PTRACE_KILL, pid, 0, 0);
                        break;
                    }
                }

                if (sc == __NR_mmap) {
                    increment_mmap_count();
                    if (get_mmap_count() > 10)
                        add_risk(5);
                }

                if (sc == __NR_pread64 || sc == __NR_lseek)
                    add_risk(2);
            }

            else if (sig == SIGSYS) {
                add_risk(100);
                printf("\n[SECCOMP] Forbidden syscall trapped\n");                
                printf("\n[RISK SCORE] %d\n", get_risk_score());
                printf("[VERDICT] MALICIOUS\n");
                ptrace(PTRACE_KILL, pid, 0, 0);
                break;
            }

            else if (sig == SIGXCPU) {
                add_risk(30);
                printf("\n[POLICY] CPU time limit exceeded\n");
                ptrace(PTRACE_KILL, pid, 0, 0);
                break;
            }
        }

        ptrace(PTRACE_SYSCALL, pid, 0, 0);
    }
}

