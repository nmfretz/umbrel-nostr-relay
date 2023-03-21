import { create } from "zustand";
import produce, { enableMapSet } from "immer";

enableMapSet();

// Turn the set method into an immer proxy
const immer = (config) => (set, get, api) =>
  config((fn) => set(produce(fn)), get, api);

export const createStore = (children) => create(immer(children));
