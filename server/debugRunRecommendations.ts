import {
  generateRecommendations,
  getRecommendationSummary,
} from './predictiveRecommendations';

async function run() {
  try {
    console.log('Running generateRecommendations...');
    const recs = generateRecommendations({
      minRelevance: 0.2,
      maxRecommendations: 10,
    });
    console.log('Result:', JSON.stringify(recs, null, 2));

    console.log('Running getRecommendationSummary...');
    const summary = getRecommendationSummary();
    console.log('Summary:', JSON.stringify(summary, null, 2));
  } catch (err) {
    console.error('Error running recommendations debug script:', err);
    if (err instanceof Error) {
      console.error(err.stack);
    }
    process.exitCode = 1;
  }
}

run();
