import { copyPackageFiles, tsc, rmDist } from 'lionconfig';

rmDist()
await tsc()
await copyPackageFiles()
