#define _GNU_SOURCE
#include "syscall_utils.h"
#include <string.h>
#include <sys/ptrace.h>
#include <sys/syscall.h>

const char *syscall_name(long sc) {
    switch (sc) {
        case __NR_read: return "read";
        case __NR_write: return "write";
        case __NR_openat: return "openat";
        case __NR_close: return "close";
        case __NR_execve: return "execve";
        case __NR_pread64: return "pread64";
        case __NR_lseek: return "lseek";
        case __NR_fstat: return "fstat";
        case __NR_mmap: return "mmap";
        case __NR_mprotect: return "mprotect";
        case __NR_brk: return "brk";
        case __NR_exit: return "exit";
        case __NR_exit_group: return "exit_group";
        default: return "runtime/internal";
    }
}

void read_child_string(pid_t pid, unsigned long addr, char *buf) {
    long word;
    int i = 0;
    while (i < 255) {
        word = ptrace(PTRACE_PEEKDATA, pid, addr + i, NULL);
        memcpy(buf + i, &word, sizeof(word));
        if (memchr(&word, 0, sizeof(word))) break;
        i += sizeof(word);
    }
    buf[255] = '\0';
}

