export * from "./user";
export * from "./credits";
export * from "./class";
export * from "./resources";
export * from "./task";
export * from "./assignment";
export * from "./calendar";
// Add other type exports here if new files are created, e.g.:
// export * from './exam';

// Ensure all specific types are exported if not covered by '*'
// For example, if CreateResourcePayload was not picked up by '*' from './resources'
// export type { CreateResourcePayload } from './resources'; // This line is likely redundant if '*' works as expected for interfaces.
