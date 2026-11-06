# Bounty-listings engine — dependency-free C++17.
#   make        build the CLI (build/bounty)
#   make test   build + run the unit tests
#   make run    build + show the sample listings
#   make clean  remove build artefacts
CXX      ?= g++
CXXFLAGS ?= -std=c++17 -Wall -Wextra -O2 -Iinclude
# /tmp may be full on some machines; keep compiler temp files in the project.
export TMPDIR ?= $(CURDIR)/.tmp

LIB_SRC := src/listing.cpp src/store.cpp src/query.cpp src/importer.cpp
LIB_OBJ := $(LIB_SRC:src/%.cpp=build/%.o)

.PHONY: all test run clean

all: build/bounty

build/bounty: $(LIB_OBJ) build/main.o
	@mkdir -p build
	$(CXX) $(CXXFLAGS) $^ -o $@

build/%.o: src/%.cpp
	@mkdir -p build .tmp
	$(CXX) $(CXXFLAGS) -c $< -o $@

build/test_main.o: tests/test_main.cpp
	@mkdir -p build .tmp
	$(CXX) $(CXXFLAGS) -c $< -o $@

build/test_runner: $(LIB_OBJ) build/test_main.o
	@mkdir -p build
	$(CXX) $(CXXFLAGS) $^ -o $@

test: build/test_runner
	./build/test_runner

run: build/bounty
	./build/bounty

clean:
	rm -rf build .tmp
