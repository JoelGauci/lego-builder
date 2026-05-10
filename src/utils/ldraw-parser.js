import fs from "fs";
import path from "path";

/**
 * Analyzes an LDraw (.mpd or .ldr) file to count total building steps.
 * Follows the LDraw specification logic:
 * 1. Restricts analysis to the primary model component (first '0 FILE' block in an MPD).
 * 2. Identifies valid '0 STEP' Meta-commands.
 * 3. Resolves correctly if the file lacks steps (fallback to 1 step).
 *
 * @param {string} filePath - Absolute path to the LDraw file.
 * @returns {number} - Total steps calculated.
 */
export function countModelSteps(filePath) {
  try {
    if (!fs.existsSync(filePath)) return 1;

    const content = fs.readFileSync(filePath, "utf-8");
    let targetContent = content;

    // In Multi-Part Documents (MPD), the main model is typically EVERYTHING from line 1 until the first '0 FILE' declaration,
    // UNLESS that section only contains config headers.
    const fileBoundaryRegex = /^\s*0\s+FILE\b/gim;
    const fileStarts = [...content.matchAll(fileBoundaryRegex)];

    if (fileStarts.length > 0) {
      // Check if there are any geometry lines BEFORE the very first declared file
      const prefixContent = content.substring(0, fileStarts[0].index);
      if (/^\s*[1-5]\s+/m.test(prefixContent)) {
        targetContent = prefixContent;
      } else {
        // Fallback to first explicit file block
        targetContent = content.substring(
          fileStarts[0].index,
          fileStarts.length > 1 ? fileStarts[1].index : undefined,
        );
      }
    }

    // Separate the text into trimmed lines to ignore blank spacers
    const lines = targetContent
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    let stepCount = 0;
    let pendingStep = false;

    // Logic derived from audited LDrawLoader: step command primes a state flag.
    // The next object line triggers initialization of the new group incrementing the actual step count.
    for (const line of lines) {
      // Lines starting with 1, 2, 3, 4, 5 represent geometry components
      if (/^[1-5]/.test(line)) {
        if (pendingStep) {
          stepCount++;
          pendingStep = false;
        }
      } else if (/^0\s+(STEP|ROTSTEP)\b/i.test(line)) {
        pendingStep = true;
      }
    }

    // Start count is 1 (the default base step containing the very first parts loaded)
    return stepCount + 1;
  } catch (error) {
    console.error(
      `Error processing LDraw file step count [${filePath}]:`,
      error,
    );
    return 1;
  }
}
