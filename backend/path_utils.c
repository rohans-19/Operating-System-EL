#include "path_utils.h"
#include <string.h>

int is_sensitive(const char *p) {
    
    return strstr(p, "/etc/passwd") ||
           strstr(p, "/etc/shadow") ||
           strstr(p, "/etc/shadow-") ||      
           strstr(p, "/etc/gshadow") ||      
           
           
           strstr(p, "/etc/sudoers") ||
           strstr(p, "/etc/sudoers.d/") ||
           
           
           strstr(p, "/etc/ssh/") ||
           strstr(p, "/.ssh/") ||             
           strstr(p, "/root/.ssh/") ||
           
           
           strstr(p, "/proc") ||
           strstr(p, "/sys") ||
           strstr(p, "/boot") ||
           
           
           strstr(p, "/dev/mem") ||
           strstr(p, "/dev/kmem") ||
           strstr(p, "/dev/port") ||
           
           
           strstr(p, "/etc/security/") ||    
           strstr(p, "/etc/pam.d/") ||       
           strstr(p, "/etc/group") ||        
           strstr(p, "/etc/hosts.allow") ||  
           strstr(p, "/etc/hosts.deny");
}