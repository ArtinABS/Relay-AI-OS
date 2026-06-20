import { createLocalId, readJsonFile, writeJsonFile } from "./store";

export type RelayNote = {
  id: string;
  body: string;
  createdAt: string;
};

const notesFile = "notes.json";

export async function listNotes() {
  return readJsonFile<RelayNote[]>(notesFile, []);
}

export async function addNote(body: string) {
  const notes = await listNotes();
  const note: RelayNote = {
    id: createLocalId("note"),
    body: body.trim(),
    createdAt: new Date().toISOString(),
  };

  await writeJsonFile(notesFile, [note, ...notes]);
  return note;
}

export async function searchNotes(query: string) {
  const normalized = query.toLowerCase();
  const notes = await listNotes();
  return notes.filter((note) => note.body.toLowerCase().includes(normalized));
}

export async function deleteNote(identifier: string) {
  const notes = await listNotes();
  const indexFromNumber = Number(identifier);
  const targetIndex = Number.isInteger(indexFromNumber)
    ? indexFromNumber - 1
    : -1;
  const deleted = notes.find(
    (note, index) =>
      note.id === identifier ||
      index === targetIndex ||
      note.body.toLowerCase().includes(identifier.toLowerCase()),
  );

  if (!deleted) return null;

  await writeJsonFile(
    notesFile,
    notes.filter((note) => note.id !== deleted.id),
  );
  return deleted;
}
