# Test case for [#35] (FIXED)

```shell-session
$ pnpm run typecheck

> temporal-polyfill-bug@1.0.0 typecheck /src/temporal-polyfill-bug
> tsc --build tsconfig.json

index.ts:1:26 - error TS1479: The current file is a CommonJS module whose imports will produce 'require' calls; however, the referenced file is an ECMAScript module and cannot be imported with 'require'. Consider writing a dynamic 'import("temporal-polyfill")' call instead.
  To convert this file to an ECMAScript module, change its file extension to '.mts', or add the field `"type": "module"` to '/src/temporal-polyfill-bug/package.json'.

1 import { Temporal } from 'temporal-polyfill';
                           ~~~~~~~~~~~~~~~~~~~


Found 1 error.

 ELIFECYCLE  Command failed with exit code 1.
```

[#35]: https://github.com/fullcalendar/temporal-polyfill/issues/35
