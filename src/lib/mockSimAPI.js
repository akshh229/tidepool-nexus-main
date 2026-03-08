/**
 * Mock SimAPI — used by Lovable during UI-only development.
 *
 * In production, replace this import:
 *   import { simAPI } from '@/lib/mockSimAPI'
 * with:
 *   import { simAPI } from '@/simAPI'
 *
 * Or leave this file in place — when the real simAPI is present,
 * the Lovable components should import from '@/simAPI' directly.
 *
 * This file re-exports the real simAPI so it works as a drop-in
 * replacement once the sim engine files are merged into the project.
 */
export { simAPI } from '../simAPI.js';
