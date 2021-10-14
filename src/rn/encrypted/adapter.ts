import { Domain } from "effector";
import EncryptedStorage from "react-native-encrypted-storage";

import type { StorageAdapter } from "../../types";
import { persist as base } from '../../persist'

const adapter: StorageAdapter = (key) => ({
  get: async () => {
    return EncryptedStorage.getItem(key).then((value) =>
      value ? JSON.parse(value) : undefined,
    );
  },
  set: async (value) => {
    return EncryptedStorage.setItem(key, JSON.stringify(value));
  },
});

export const encryptedStorageAdapter = (domain: Domain) => {
  domain.onCreateStore((store) => base({ store, adapter }));
};
