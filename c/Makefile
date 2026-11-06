# bounty — fast bounty-listings CLI (C11, no dependencies)
CC      ?= gcc
CFLAGS  ?= -std=c11 -O2 -Wall -Wextra -Werror -D_POSIX_C_SOURCE=200809L
CPPFLAGS ?= -Isrc

SRC_LIB = src/bounty.c
SRC_CLI = src/main.c
OBJ_LIB = $(SRC_LIB:.c=.o)
OBJ_CLI = $(SRC_CLI:.c=.o)

BIN     = bounty
TESTBIN = test_bounty

.PHONY: all build test bench clean

all: build

build: $(BIN)

$(BIN): $(OBJ_LIB) $(OBJ_CLI)
	$(CC) $(CFLAGS) -o $@ $(OBJ_LIB) $(OBJ_CLI)

%.o: %.c src/bounty.h
	$(CC) $(CFLAGS) $(CPPFLAGS) -c $< -o $@

$(TESTBIN): tests/test_bounty.c $(OBJ_LIB)
	$(CC) $(CFLAGS) $(CPPFLAGS) -o $@ tests/test_bounty.c $(OBJ_LIB)

# Unit tests (library) + CLI smoke checks (binary).
test: $(TESTBIN) $(BIN)
	./$(TESTBIN)
	./$(BIN) validate --file data/sample.tsv
	./$(BIN) list --file data/sample.tsv --status open --sort reward --limit 3
	./$(BIN) list --file data/sample.tsv --search security
	./$(BIN) bench --n 20000 --iters 3

bench: $(BIN)
	./$(BIN) bench

clean:
	rm -f $(BIN) $(TESTBIN) $(OBJ_LIB) $(OBJ_CLI)
