import { getMySubscriptions } from '../server/googleYoutubeService.ts';

async function testYoutubeAuth() {
  console.log('Testing YouTube authentication...');
  const result = await getMySubscriptions('default-user');
  console.log(result);
}

testYoutubeAuth();
