export interface Note {
  beat: number;
  direction: number;
}

export interface Chart {
  type: string;
  description: string;
  difficulty: string;
  meter: number;
  notes: Note[];
}

export interface SmFile {
  title: string;
  artist: string;
  offset: number;
  bpms: { beat: number; bpm: number }[];
  charts: Chart[];
}

export function parseSmFile(smText: string): SmFile {
  const lines = smText.split('\n').map((line) => line.trim());

  const smFile: Partial<SmFile> = { bpms: [], charts: [], offset: 0 };

  let inNotes = false;
  let currentChart: Partial<Chart> = {};
  let measureBuffer: string[][] = [];
  let measureBeat = 0;

  for (const line of lines) {
    if (line.startsWith('#')) {
      const [key, value] = line.slice(1).split(':', 2).map(s => s.replace(';', '').trim());
      switch (key.toUpperCase()) {
        case 'TITLE':
          smFile.title = value;
          break;
        case 'ARTIST':
          smFile.artist = value;
          break;
        case 'OFFSET':
          smFile.offset = parseFloat(value);
          break;
        case 'BPMS':
          smFile.bpms = value.split(',').map((bpmEntry) => {
            const [beat, bpm] = bpmEntry.split('=');
            return { beat: parseFloat(beat), bpm: parseFloat(bpm) };
          });
          break;
        case 'NOTES':
          inNotes = true;
          currentChart = {};
          measureBuffer = [];
          measureBeat = 0;
          break;
      }
    } else if (inNotes) {
      if (line.includes(':')) {
        // Chart metadata
        if (line.trim()) {
            const value = line.trim().replace(':', '');
            if (!currentChart.type) currentChart.type = value;
            else if (!currentChart.description) currentChart.description = value;
            else if (!currentChart.difficulty) currentChart.difficulty = value;
            else if (!currentChart.meter) currentChart.meter = parseInt(value, 10);
        }
      } else if (line.startsWith(',') || line.startsWith(';')) {
        // End of a measure or chart
        if (measureBuffer.length > 0) {
          const notesInMeasure = measureBuffer.length;
          measureBuffer.forEach((noteLine, i) => {
            for (let dir = 0; dir < noteLine.length; dir++) {
              if (noteLine[dir] === '1') { // '1' is a standard note
                const beat = measureBeat + (i / notesInMeasure) * 4;
                if (!currentChart.notes) currentChart.notes = [];
                currentChart.notes.push({ beat, direction: dir });
              }
            }
          });
          measureBeat += 4;
          measureBuffer = [];
        }

        if (line.startsWith(';')) {
          if(currentChart.notes) {
            smFile.charts?.push(currentChart as Chart);
          }
          inNotes = false;
        }
      } else if (line.length > 0 && /^[0-9MKLF]+$/.test(line)) {
        // Note data line within a measure
        measureBuffer.push(line.split(''));
      }
    }
  }

  return smFile as SmFile;
}
