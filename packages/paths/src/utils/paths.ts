/* eslint-disable import/no-mutable-exports */

import { getProjectDir } from 'lion-utils'
import mapObject from 'map-obj'
import type { KebabCase } from 'type-fest'
// Using `upath` for browser compatibility
import path from 'upath'

export let monorepoDir: string
export let packagesDir: string
/**
	We use a try-catch in case `@dialect-inc/paths` is imported from a browser
	context, as `getProjectDir` uses `node:fs` which errors in a browser.
*/
try {
	monorepoDir = getProjectDir(
		// We do this explicit check because @dialect-inc/paths is included in @dialect-inc/vscode-extension which emits CommonJS
		import.meta.url,
		{ monorepoRoot: true }
	)
	packagesDir = path.join(monorepoDir, 'packages')
} catch {
	monorepoDir = '/'
	packagesDir = '/packages'
}

// Utility functions for converting to and from packageName
const packageNameToSlug = (packageName: string) =>
	packageName.replace('@dialect-inc/', '')
const packageSlugToName = (packageSlug: string) => `@dialect-inc/${packageSlug}`

const packageNameToDir = (packageName: string) =>
	packageName === '@dialect-inc/monorepo'
		? monorepoDir
		: path.join(packagesDir, packageNameToSlug(packageName))
const packageDirToName = (packageDir: string) =>
	path.normalize(packageDir) === path.normalize(monorepoDir)
		? '@dialect-inc/monorepo'
		: `@dialect-inc/${path.relative(packagesDir, packageDir)}`

// todo: figure out how to export this from another file

export function getPackageSlug(args: { packageDir: string }): string
export function getPackageSlug(args: { packageName: string }): string
export function getPackageSlug(
	args: { packageDir: string } | { packageName: string }
): string {
	let packageName: string
	if ('packageDir' in args) {
		packageName = packageDirToName(args.packageDir)
	} else {
		packageName = args.packageName
	}

	return packageNameToSlug(packageName)
}

export function getPackageName(args: { packageDir: string }): string
export function getPackageName(args: { packageSlug: string }): string
export function getPackageName(
	args: { packageDir: string } | { packageSlug: string }
): string {
	if ('packageDir' in args) {
		return packageDirToName(args.packageDir)
	} else {
		return packageSlugToName(args.packageSlug)
	}
}

export function getPackageDir(args: { packageName: string }): string
export function getPackageDir(args: { packageSlug: string }): string
export function getPackageDir(
	args: { packageName: string } | { packageSlug: string }
): string {
	let packageName: string
	if ('packageSlug' in args) {
		packageName = packageSlugToName(args.packageSlug)
	} else {
		packageName = args.packageName
	}

	return packageNameToDir(packageName)
}

/**
	A wrapper function to ensure that the package slugs map from a camelcased property key to a kebab-cased package slug.
*/
const definePackageSlugs = <K extends string, V extends KebabCase<K>>(
	packageSlugs: Record<K, V>
) => packageSlugs

export const packageSlugs = definePackageSlugs({
	monorepo: 'monorepo',
	paths: 'paths',
	pnpmScripts: 'pnpm-scripts',
	server: 'server',
})

export const packageDirs = mapObject(
	packageSlugs,
	(packageKey, packageSlug) => [packageKey, getPackageDir({ packageSlug })]
)

export const packageNames = mapObject(
	packageSlugs,
	(packageKey, packageSlug) => [packageKey, getPackageName({ packageSlug })]
)
