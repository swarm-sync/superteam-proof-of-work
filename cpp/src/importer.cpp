#include "importer.h"

#include <cctype>
#include <map>

// Minimal JSON parser for the listing shape only — no external dependency.
// Parses: array of objects; values are strings, integers, or string arrays.
// Anything else (nested objects, floats, booleans, null) is a parse error.

namespace bounty {
namespace {

// --- tiny recursive-descent parser over a string view ---
struct Parser {
    const std::string& s;
    std::size_t pos = 0;
    std::string error;

    void skip_ws() {
        while (pos < s.size() && std::isspace(static_cast<unsigned char>(s[pos]))) ++pos;
    }
    bool consume(char c) {
        skip_ws();
        if (pos < s.size() && s[pos] == c) { ++pos; return true; }
        return false;
    }
    bool expect(char c, const char* what) {
        if (!consume(c)) { error = std::string("expected ") + what; return false; }
        return true;
    }
    bool parse_string(std::string& out) {
        skip_ws();
        if (pos >= s.size() || s[pos] != '"') { error = "expected string"; return false; }
        ++pos;
        out.clear();
        while (pos < s.size()) {
            char c = s[pos++];
            if (c == '"') return true;
            if (c == '\\' && pos < s.size()) {
                char e = s[pos++];
                switch (e) {
                    case 'n': out += '\n'; break;
                    case 't': out += '\t'; break;
                    case 'r': out += '\r'; break;
                    case '"': out += '"'; break;
                    case '\\': out += '\\'; break;
                    case '/': out += '/'; break;
                    default: error = "unsupported escape in string"; return false;
                }
            } else {
                out += c;
            }
        }
        error = "unterminated string";
        return false;
    }
    bool parse_int(int& out) {
        skip_ws();
        std::size_t start = pos;
        if (pos < s.size() && (s[pos] == '-' || s[pos] == '+')) ++pos;
        if (pos >= s.size() || !std::isdigit(static_cast<unsigned char>(s[pos]))) {
            error = "expected integer";
            return false;
        }
        while (pos < s.size() && std::isdigit(static_cast<unsigned char>(s[pos]))) ++pos;
        try {
            out = std::stoi(s.substr(start, pos - start));
        } catch (...) {
            error = "integer out of range";
            return false;
        }
        return true;
    }
    // Parses one object into string/int/string-array fields.
    bool parse_object(std::map<std::string, std::string>& str_fields,
                      std::map<std::string, int>& int_fields,
                      std::map<std::string, std::vector<std::string>>& arr_fields) {
        if (!expect('{', "'{'")) return false;
        skip_ws();
        if (consume('}')) return true;  // empty object (validation will reject it)
        while (true) {
            std::string key;
            if (!parse_string(key)) return false;
            if (!expect(':', "':'")) return false;
            skip_ws();
            if (pos < s.size() && s[pos] == '"') {
                std::string v;
                if (!parse_string(v)) return false;
                str_fields[key] = v;
            } else if (pos < s.size() && s[pos] == '[') {
                ++pos;
                std::vector<std::string> items;
                skip_ws();
                if (consume(']')) { arr_fields[key] = items; }
                else {
                    while (true) {
                        std::string v;
                        if (!parse_string(v)) return false;
                        items.push_back(v);
                        if (consume(']')) break;
                        if (!expect(',', "','")) return false;
                    }
                    arr_fields[key] = items;
                }
            } else {
                int v = 0;
                if (!parse_int(v)) return false;
                int_fields[key] = v;
            }
            if (consume('}')) return true;
            if (!expect(',', "','")) return false;
        }
    }
};

}  // namespace

bool import_json(const std::string& text, std::vector<Listing>& out, std::string& error) {
    Parser p{text, 0, std::string{}};
    out.clear();
    p.skip_ws();
    if (!p.expect('[', "'[' at top level")) { error = p.error; return false; }
    p.skip_ws();
    if (p.consume(']')) return true;  // empty array is valid
    std::vector<Listing> parsed;
    while (true) {
        std::map<std::string, std::string> strs;
        std::map<std::string, int> ints;
        std::map<std::string, std::vector<std::string>> arrs;
        if (!p.parse_object(strs, ints, arrs)) { error = p.error; return false; }
        Listing l;
        auto get_str = [&](const char* k, std::string& dst) {
            auto it = strs.find(k);
            if (it != strs.end()) dst = it->second;
        };
        get_str("id", l.id);
        get_str("title", l.title);
        get_str("org", l.org);
        auto ri = ints.find("reward_usd");
        if (ri != ints.end()) l.reward_usd = ri->second;
        auto ai = arrs.find("skills");
        if (ai != arrs.end()) l.skills = ai->second;
        auto si = strs.find("status");
        if (si != strs.end()) {
            bool ok = false;
            l.status = status_from_string(si->second, ok);
            if (!ok) { error = "unknown status: " + si->second; return false; }
        }
        const std::string v = l.validation_error();
        if (!v.empty()) { error = "invalid listing '" + l.id + "': " + v; return false; }
        parsed.push_back(l);
        if (p.consume(']')) break;
        if (!p.expect(',', "',' between listings")) { error = p.error; return false; }
    }
    p.skip_ws();
    if (p.pos != text.size()) { error = "trailing characters after JSON array"; return false; }
    out = parsed;
    error.clear();
    return true;
}

}  // namespace bounty
