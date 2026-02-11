#include "path_utils.h"
#include <string.h>

int is_sensitive(const char *p) {
    return strstr(p, "/etc/passwd") ||
           strstr(p, "/etc/shadow") ||
           strstr(p, "/proc") ||
           strstr(p, "/sys")||
           strstr(p, "/etc/shadow-") ||
           strstr(p, "/etc/gshadow") ||
           strstr(p, "/etc/sudoers") ||
           strstr(p, "/etc/ssh/") ||
           strstr(p, "/boot/") ||
           strstr(p, "/dev/mem")||
           strstr(p, "/dev/kmem");
}

