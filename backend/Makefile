CC = gcc
CFLAGS = -Wall -Wextra -O2
TARGET = sandbox


SRCS = main.c syscall_utils.c path_utils.c risk_manager.c seccomp_filter.c child_process.c monitor.c


OBJS = $(SRCS:.c=.o)


HEADERS = syscall_utils.h path_utils.h risk_manager.h seccomp_filter.h child_process.h monitor.h


all: $(TARGET)


$(TARGET): $(OBJS)
	$(CC) $(CFLAGS) -o $(TARGET) $(OBJS)


%.o: %.c $(HEADERS)
	$(CC) $(CFLAGS) -c $< -o $@


clean:
	rm -f $(OBJS) $(TARGET)


rebuild: clean all


test: $(TARGET)
	./$(TARGET) /bin/ls

.PHONY: all clean rebuild test

