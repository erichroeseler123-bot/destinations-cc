export function loadServerNodeModule<T = unknown>(moduleId: string): T {
  const getBuiltin =
    typeof process !== "undefined"
      ? (process as unknown as { getBuiltinModule?: (id: string) => unknown }).getBuiltinModule
      : undefined;
  if (getBuiltin) {
    if (moduleId.startsWith("node:")) {
      const builtin = getBuiltin(moduleId);
      if (builtin) return builtin as T;
    }
    const nodeModule = getBuiltin("node:module") as
      | { createRequire?: (filename: string) => (id: string) => unknown }
      | undefined;
    if (nodeModule?.createRequire) {
      const runtimeRequire = nodeModule.createRequire(`${process.cwd()}/package.json`);
      return runtimeRequire(moduleId) as T;
    }
  }
  throw new Error(`Server module "${moduleId}" is unavailable in this runtime.`);
}
