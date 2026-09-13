use std::env;
use std::fs;
use std::io::{self, Write};
use std::path::{Path, PathBuf};

fn json_escape(s: &str) -> String {
    let mut out = String::with_capacity(s.len() + 8);
    for c in s.chars() {
        match c {
            '"' => out.push_str("\\\""),
            '\\' => out.push_str("\\\\"),
            '\n' => out.push_str("\\n"),
            '\r' => out.push_str("\\r"),
            '\t' => out.push_str("\\t"),
            c if (c as u32) < 0x20 => out.push_str(&format!("\\u{:04x}", c as u32)),
            c => out.push(c),
        }
    }
    out
}

fn jstr(s: &str) -> String {
    format!("\"{}\"", json_escape(s))
}

struct Frontmatter {
    name: Option<String>,
    description: Option<String>,
    related: Vec<String>,
}

fn parse_frontmatter(text: &str) -> Frontmatter {
    let mut fm = Frontmatter { name: None, description: None, related: Vec::new() };
    let text = text.strip_prefix('\u{feff}').unwrap_or(text);
    if !text.starts_with("---") {
        return fm;
    }
    let rest = &text[3..];
    let rest = rest.strip_prefix('\n').or_else(|| rest.strip_prefix("\r\n")).unwrap_or(rest);
    let end = match rest.find("\n---") {
        Some(i) => i,
        None => return fm,
    };
    let front = &rest[..end];

    let mut in_related = false;
    for line in front.lines() {
        let trimmed = line.trim_end();
        if in_related {
            if let Some(item) = trimmed.trim_start().strip_prefix("- ") {
                fm.related.push(item.trim().to_string());
                continue;
            }
            if !trimmed.is_empty() && !line.starts_with(char::is_whitespace) {
                in_related = false;
            } else if trimmed.is_empty() {
                continue;
            }
        }
        if let Some(v) = trimmed.strip_prefix("name:") {
            if fm.name.is_none() {
                fm.name = Some(v.trim().to_string());
            }
            in_related = false;
        } else if let Some(v) = trimmed.strip_prefix("description:") {
            if fm.description.is_none() {
                fm.description = Some(v.trim().to_string());
            }
            in_related = false;
        } else if trimmed.trim_end() == "related:" {
            in_related = true;
        } else if !line.starts_with(char::is_whitespace) && trimmed.contains(':') {
            in_related = false;
        }
    }
    fm
}

struct Acc {
    nodes: String,
    edges: String,
    edge_keys: std::collections::HashSet<String>,
}

impl Acc {
    fn new() -> Self {
        Acc { nodes: String::new(), edges: String::new(), edge_keys: std::collections::HashSet::new() }
    }
    fn push_node(&mut self, id: &str, label: &str, title: &str, group: &str, ty: &str, dir: &str, file: &Path) {
        if !self.nodes.is_empty() {
            self.nodes.push(',');
        }
        self.nodes.push_str(&format!(
            "{{\"id\":{},\"label\":{},\"title\":{},\"group\":{},\"type\":{},\"dir\":{},\"file\":{}}}",
            jstr(id),
            jstr(label),
            jstr(title),
            jstr(group),
            jstr(ty),
            jstr(dir),
            jstr(&file.to_string_lossy()),
        ));
    }
    fn push_edge(&mut self, from: &str, to: &str) {
        let key = format!("{}->{}", from, to);
        if !self.edge_keys.insert(key) {
            return;
        }
        if !self.edges.is_empty() {
            self.edges.push(',');
        }
        self.edges.push_str(&format!("{{\"from\":{},\"to\":{}}}", jstr(from), jstr(to)));
    }
}

fn scan_dir(root: &Path, file_name: &str, ty: &str, acc: &mut Acc) {
    let entries = match fs::read_dir(root) {
        Ok(e) => e,
        Err(_) => return,
    };
    for entry in entries.flatten() {
        let dir = entry.path();
        if !dir.is_dir() {
            continue;
        }
        let dir_name = match dir.file_name().and_then(|n| n.to_str()) {
            Some(n) => n.to_string(),
            None => continue,
        };
        if dir_name.starts_with('.') {
            continue;
        }
        let file = dir.join(file_name);
        if !file.is_file() {
            continue;
        }
        let text = match fs::read_to_string(&file) {
            Ok(t) => t,
            Err(_) => continue,
        };
        let fm = parse_frontmatter(&text);
        let base = fm.name.clone().unwrap_or_else(|| dir_name.clone());
        let (id, label, group) = if ty == "subagent" {
            (format!("agent:{}", base), base.clone(), "subagent".to_string())
        } else {
            (base.clone(), base.clone(), base.split('-').next().unwrap_or("default").to_string())
        };
        acc.push_node(&id, &label, fm.description.as_deref().unwrap_or(""), &group, ty, &dir_name, &file);
        for r in &fm.related {
            acc.push_edge(&id, r);
        }
    }
}

fn main() -> io::Result<()> {
    let home = env::var("USERPROFILE").or_else(|_| env::var("HOME")).unwrap_or_default();
    let skills_root = env::var("SKILLS_ROOT")
        .unwrap_or_else(|_| format!("{}\\AppData\\Roaming\\devin\\skills", home));
    let agents_root = env::var("AGENTS_ROOT")
        .unwrap_or_else(|_| format!("{}\\.config\\devin\\agents", home));

    let mut skills = Acc::new();
    scan_dir(PathBuf::from(&skills_root).as_path(), "SKILL.md", "skill", &mut skills);

    let mut agents = Acc::new();
    scan_dir(PathBuf::from(&agents_root).as_path(), "AGENT.md", "subagent", &mut agents);

    let out = format!(
        "{{\"skills\":{{\"nodes\":[{}],\"edges\":[{}]}},\"agents\":{{\"nodes\":[{}],\"edges\":[{}]}}}}",
        skills.nodes, skills.edges, agents.nodes, agents.edges
    );
    io::stdout().write_all(out.as_bytes())
}
