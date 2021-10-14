import { Domain } from "effector";
import AsyncStorage from "@react-native-async-storage/async-storage";

import type { StorageAdapter } from "../../types";
import { persist as base } from '../../persist'

const adapter: StorageAdapter = (key) => ({
  get: async () => {
    return AsyncStorage.getItem(key).then((value) =>
      value ? JSON.parse(value) : undefined,
    );
  },
  set: async (value) => {
    return AsyncStorage.setItem(key, JSON.stringify(value));
  },
});

export const asyncStorageAdapter = (domain: Domain) => {
  domain.onCreateStore((store) => base({ store, adapter }));
};
