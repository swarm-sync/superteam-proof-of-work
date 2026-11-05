import { onMounted, watch } from 'vue';

// Autosaves the draft to localStorage (debounced) and restores it on load.
// No network, no account: the draft never leaves the user's browser.
export function useDraft(form, key = 'solana-grant-draft-v1') {
	function save() {
		try { localStorage.setItem(key, JSON.stringify(form.value)); } catch { /* storage full/blocked: draft is best-effort */ }
	}
	function load() {
		try {
			const raw = localStorage.getItem(key);
			if (raw) Object.assign(form.value, JSON.parse(raw));
		} catch { /* corrupt draft: start fresh */ }
	}
	function clear() {
		try { localStorage.removeItem(key); } catch { /* ignore */ }
	}
	let timer;
	onMounted(load);
	watch(form, () => { clearTimeout(timer); timer = setTimeout(save, 400); }, { deep: true });
	return { save, load, clear };
}
