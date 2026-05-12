const { beforeUserDeleted } = require('firebase-functions/v2/identity');
const admin = require('firebase-admin');
admin.initializeApp();
const db = admin.firestore();

exports.onUserDeleted = beforeUserDeleted(async (event) => {
  const uid = event.data.uid;
  const batch = db.batch();

  // Delete weekly leaderboard entries (weekly/{weekId}/scores/{uid})
  const scoresSnap = await db.collectionGroup('scores')
    .where('uid', '==', uid)
    .limit(500)
    .get();
  scoresSnap.docs.forEach(doc => batch.delete(doc.ref));

  // Delete user profile document
  const userDoc = db.collection('users').doc(uid);
  batch.delete(userDoc);

  await batch.commit();
});
