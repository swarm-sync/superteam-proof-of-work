// bounty — CLI for the bounty-listings engine.
// Thin orchestration only: parse argv, load data, call store/query/import,
// print results. All logic lives in the library components.
#include <fstream>
#include <iostream>
#include <sstream>
#include <string>

#include "importer.h"
#include "query.h"
#include "store.h"

namespace {
void print_usage(const char* prog) {
    std::cout << "Usage: " << prog << " [options]\n"
              << "  --file <path>        JSON file to load (default: data/listings.json)\n"
              << "  --skill <skill>      only listings with this skill\n"
              << "  --min-reward <n>     only listings paying at least $n\n"
              << "  --status <open|closed>\n"
              << "  --search <keyword>   substring match on title / org\n"
              << "  --sort <reward|reward-asc|title>   default: reward (highest first)\n"
              << "  --help               show this help\n"
              << "\nExample:\n"
              << "  bounty --skill C++ --min-reward 500 --sort reward\n";
}

void print_listing(const bounty::Listing& l) {
    std::cout << "[" << l.id << "] " << l.title << " — " << l.org
              << " — $" << l.reward_usd << " — " << bounty::status_to_string(l.status)
              << " — skills: ";
    for (std::size_t i = 0; i < l.skills.size(); ++i) {
        if (i) std::cout << ", ";
        std::cout << l.skills[i];
    }
    std::cout << "\n";
}

bool read_file(const std::string& path, std::string& out) {
    std::ifstream in(path);
    if (!in) return false;
    std::ostringstream ss;
    ss << in.rdbuf();
    out = ss.str();
    return true;
}
}  // namespace

int main(int argc, char** argv) {
    std::string file = "data/listings.json";
    bounty::Filter filter;
    bounty::SortKey sort_key = bounty::SortKey::RewardDesc;

    for (int i = 1; i < argc; ++i) {
        std::string arg = argv[i];
        auto need_value = [&](const char* flag, std::string& dst) -> bool {
            if (i + 1 >= argc) {
                std::cerr << "error: " << flag << " needs a value\n";
                return false;
            }
            dst = argv[++i];
            return true;
        };
        if (arg == "--help" || arg == "-h") { print_usage(argv[0]); return 0; }
        else if (arg == "--file") { if (!need_value("--file", file)) return 2; }
        else if (arg == "--skill") {
            std::string v; if (!need_value("--skill", v)) return 2; filter.skill = v;
        } else if (arg == "--min-reward") {
            std::string v; if (!need_value("--min-reward", v)) return 2;
            try { filter.min_reward_usd = std::stoi(v); }
            catch (...) { std::cerr << "error: --min-reward needs an integer\n"; return 2; }
        } else if (arg == "--status") {
            std::string v; if (!need_value("--status", v)) return 2;
            bool ok = false;
            filter.status = bounty::status_from_string(v, ok);
            if (!ok) { std::cerr << "error: --status must be open or closed\n"; return 2; }
        } else if (arg == "--search") {
            std::string v; if (!need_value("--search", v)) return 2; filter.keyword = v;
        } else if (arg == "--sort") {
            std::string v; if (!need_value("--sort", v)) return 2;
            if (v == "reward") sort_key = bounty::SortKey::RewardDesc;
            else if (v == "reward-asc") sort_key = bounty::SortKey::RewardAsc;
            else if (v == "title") sort_key = bounty::SortKey::TitleAsc;
            else { std::cerr << "error: --sort must be reward, reward-asc, or title\n"; return 2; }
        } else {
            std::cerr << "error: unknown option '" << arg << "'\n";
            print_usage(argv[0]);
            return 2;
        }
    }

    std::string text;
    if (!read_file(file, text)) {
        std::cerr << "error: cannot read " << file << "\n";
        return 1;
    }
    std::vector<bounty::Listing> listings;
    std::string error;
    if (!bounty::import_json(text, listings, error)) {
        std::cerr << "error: invalid JSON in " << file << ": " << error << "\n";
        return 1;
    }
    bounty::Store store;
    for (const auto& l : listings) {
        if (!store.add(l, error)) {
            std::cerr << "error: " << error << "\n";
            return 1;
        }
    }
    auto results = bounty::query(store.all(), filter, sort_key);
    if (results.empty()) {
        std::cout << "No listings match.\n";
        return 0;
    }
    for (const auto& l : results) print_listing(l);
    std::cout << results.size() << " listing(s) shown, of " << store.size() << " total.\n";
    return 0;
}
