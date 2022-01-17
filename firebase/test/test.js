/*
 * Copyright 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

const firebase = require('@firebase/testing');
const fs = require('fs');

const TEST_PROJECT_ID = 'firebase-project';
const TEST_PROJECT_CONTENTS_ID = 'firebase-project-contents';
const firebasePort = require('../firebase.json').emulators.firestore.port;
const port = firebasePort /** Exists? */ ? firebasePort : 8080;
const coverageUrl = `http://localhost:${port}/emulator/v1/projects/${TEST_PROJECT_ID}:ruleCoverage.html`;
const rules = fs.readFileSync('firestore.rules', 'utf8');
const PROJECTS = 'projects';
const PROJECT_CONTENTS = 'project_contents';
const USER_SETTINGS = 'user_settings';
const COMMENTS = 'comments';
const NEWS_UPDATES = 'news_updates';
const ADMINS = 'admins';
const TEST_CHANGELOG_ENTRY_ID = 'firebase-changlog-entry';
const ADMIN_USER_ID = 'admin';
const ADMIN_USER_EMAIL = 'admin';
const TEST_USER_ID = 'alice';
const TEST_USURPER_ID = 'usurper';
const TEST_USER_EMAIL = 'alice';

function authedApp(auth) {
  return firebase.initializeTestApp({ projectId: TEST_PROJECT_ID, auth }).firestore();
}

function adminApp(auth) {
  return firebase.initializeAdminApp({ projectId: TEST_PROJECT_ID, auth }).firestore();
}

beforeEach(async () => {
  // Clear the database between tests
  await firebase.clearFirestoreData({ projectId: TEST_PROJECT_ID });
  const adminDb = adminApp({ uid: ADMIN_USER_ID, email_verified: true });
  await adminDb
    .collection(ADMINS)
    .doc(ADMIN_USER_ID)
    .set({ email: ADMIN_USER_EMAIL });
});

before(async () => {
  await firebase.loadFirestoreRules({ projectId: TEST_PROJECT_ID, rules });
});

after(async () => {
  await Promise.all(firebase.apps().map(app => app.delete()));
  console.log(`View rule coverage information at ${coverageUrl}\n`);
});

describe('WebPrototypingTool', () => {
  it('Only users can read & edit their user_settings', async () => {
    const ownerDb = authedApp({ uid: TEST_USER_ID, email_verified: true });
    const usurperDb = authedApp({ uid: TEST_USURPER_ID, email_verified: true });
    await firebase.assertSucceeds(
      ownerDb
        .collection(USER_SETTINGS)
        .doc(TEST_USER_ID)
        .set({ darkTheme: true })
    );

    await firebase.assertSucceeds(
      ownerDb
        .collection(USER_SETTINGS)
        .doc(TEST_USER_ID)
        .get()
    );

    await firebase.assertSucceeds(
      ownerDb
        .collection(USER_SETTINGS)
        .doc(TEST_USER_ID)
        .update({ darkTheme: false })
    );

    await firebase.assertFails(
      usurperDb
        .collection(USER_SETTINGS)
        .doc(TEST_USER_ID)
        .get()
    );

    await firebase.assertFails(
      usurperDb
        .collection(USER_SETTINGS)
        .doc(TEST_USER_ID)
        .update({ darkTheme: false })
    );
  });

  it('Auth user can create a project', async () => {
    const db = authedApp({ uid: TEST_USER_ID, email_verified: true });
    const project = db.collection(PROJECTS).doc(TEST_PROJECT_ID);
    await firebase.assertSucceeds(
      project.set({
        name: 'my project',
        owner: {
          id: TEST_USER_ID,
          email: TEST_USER_EMAIL,
        },
      })
    );
  });

  it('Owner can update a project', async () => {
    const ownerDb = authedApp({ uid: TEST_USER_ID, email_verified: true });
    const editName = 'new project name';

    await ownerDb
      .collection(PROJECTS)
      .doc(TEST_PROJECT_ID)
      .set({
        name: 'my project',
        owner: {
          id: TEST_USER_ID,
          email: TEST_USER_EMAIL,
        },
      });

    await firebase.assertSucceeds(
      ownerDb
        .collection(PROJECTS)
        .doc(TEST_PROJECT_ID)
        .update({
          name: editName,
        })
    );
  });

  it('Non owner cannot update a project', async () => {
    const ownerDb = authedApp({ uid: TEST_USER_ID, email_verified: true });
    const usurperDb = authedApp({ uid: TEST_USURPER_ID, email_verified: true });
    const editName = 'new project name';
    await ownerDb
      .collection(PROJECTS)
      .doc(TEST_PROJECT_ID)
      .set({
        name: 'my project',
        owner: {
          id: TEST_USER_ID,
          email: TEST_USER_EMAIL,
        },
      });

    await firebase.assertFails(
      usurperDb
        .collection(PROJECTS)
        .doc(TEST_PROJECT_ID)
        .update({ name: editName })
    );
  });

  it('Owner can delete a project', async () => {
    const ownerDb = authedApp({ uid: TEST_USER_ID, email_verified: true });
    await ownerDb
      .collection(PROJECTS)
      .doc(TEST_PROJECT_ID)
      .set({
        owner: {
          id: TEST_USER_ID,
          email: TEST_USER_EMAIL,
        },
      });

    await firebase.assertSucceeds(
      ownerDb
        .collection(PROJECTS)
        .doc(TEST_PROJECT_ID)
        .delete()
    );
  });

  it('Non owner cannot delete a project', async () => {
    const ownerDb = authedApp({ uid: TEST_USER_ID, email_verified: true });
    const usurperDb = authedApp({ uid: TEST_USURPER_ID, email_verified: true });
    await ownerDb
      .collection(PROJECTS)
      .doc(TEST_PROJECT_ID)
      .set({
        owner: {
          id: TEST_USER_ID,
          email: TEST_USER_EMAIL,
        },
      });

    await firebase.assertFails(
      usurperDb
        .collection(PROJECTS)
        .doc(TEST_PROJECT_ID)
        .delete()
    );
  });

  it('Owner can create/update/delete project contents', async () => {
    const ownerDb = authedApp({ uid: TEST_USER_ID, email_verified: true });
    // Create a Project
    await ownerDb
      .collection(PROJECTS)
      .doc(TEST_PROJECT_ID)
      .set({
        name: 'my project',
        numComments: 0,
        owner: {
          id: TEST_USER_ID,
          email: TEST_USER_EMAIL,
        },
      });
    // Owner creates project_contents
    await firebase.assertSucceeds(
      ownerDb
        .collection(PROJECT_CONTENTS)
        .doc(TEST_PROJECT_CONTENTS_ID)
        .set({
          state: 'test',
          type: 'Element',
          projectId: TEST_PROJECT_ID,
        })
    );
    // Owner Updates project_contents
    await firebase.assertSucceeds(
      ownerDb
        .collection(PROJECT_CONTENTS)
        .doc(TEST_PROJECT_CONTENTS_ID)
        .update({ state: 'test2' })
    );
    // Owner deletes project_contents
    await firebase.assertSucceeds(
      ownerDb
        .collection(PROJECT_CONTENTS)
        .doc(TEST_PROJECT_CONTENTS_ID)
        .delete()
    );
  });

  it('Non-owner cannot create project contents', async () => {
    const ownerDb = authedApp({ uid: TEST_USER_ID, email_verified: true });
    const usurperDb = authedApp({ uid: TEST_USURPER_ID, email_verified: true });
    // Create a Project
    await ownerDb
      .collection(PROJECTS)
      .doc(TEST_PROJECT_ID)
      .set({
        name: 'my project',
        numComments: 0,
        owner: {
          id: TEST_USER_ID,
          email: TEST_USER_EMAIL,
        },
      });

    await firebase.assertFails(
      usurperDb
        .collection(PROJECT_CONTENTS)
        .doc(TEST_PROJECT_CONTENTS_ID)
        .set({
          state: 'test',
          type: 'Element',
          projectId: TEST_PROJECT_ID,
        })
    );
  });

  it('Non-owner cannot update project contents', async () => {
    const ownerDb = authedApp({ uid: TEST_USER_ID, email_verified: true });
    const usurperDb = authedApp({ uid: TEST_USURPER_ID, email_verified: true });
    // Create a Project
    await ownerDb
      .collection(PROJECTS)
      .doc(TEST_PROJECT_ID)
      .set({
        name: 'my project',
        numComments: 0,
        owner: {
          id: TEST_USER_ID,
          email: TEST_USER_EMAIL,
        },
      });

    // Owner creates project_contents
    await firebase.assertSucceeds(
      ownerDb
        .collection(PROJECT_CONTENTS)
        .doc(TEST_PROJECT_CONTENTS_ID)
        .set({
          state: 'test',
          type: 'Element',
          projectId: TEST_PROJECT_ID,
        })
    );

    // Userper Updates project_contents
    await firebase.assertFails(
      usurperDb
        .collection(PROJECT_CONTENTS)
        .doc(TEST_PROJECT_CONTENTS_ID)
        .update({ state: 'test2' })
    );
  });

  it('Non-owner cannot delete project contents', async () => {
    const ownerDb = authedApp({ uid: TEST_USER_ID, email_verified: true });
    const usurperDb = authedApp({ uid: TEST_USURPER_ID, email_verified: true });
    // Create a Project
    await ownerDb
      .collection(PROJECTS)
      .doc(TEST_PROJECT_ID)
      .set({
        name: 'my project',
        numComments: 0,
        owner: {
          id: TEST_USER_ID,
          email: TEST_USER_EMAIL,
        },
      });

    // Owner creates project_contents
    await firebase.assertSucceeds(
      ownerDb
        .collection(PROJECT_CONTENTS)
        .doc(TEST_PROJECT_CONTENTS_ID)
        .set({
          state: 'test',
          type: 'Element',
          projectId: TEST_PROJECT_ID,
        })
    );

    // Userper deletes project_contents
    await firebase.assertFails(
      usurperDb
        .collection(PROJECT_CONTENTS)
        .doc(TEST_PROJECT_CONTENTS_ID)
        .delete()
    );
  });

  it('Owner can delete non-existent document', async () => {
    const ownerDb = authedApp({ uid: TEST_USER_ID, email_verified: true });

    // Create a Project
    await ownerDb
      .collection(PROJECTS)
      .doc(TEST_PROJECT_ID)
      .set({
        name: 'my project',
        numComments: 0,
        owner: {
          id: TEST_USER_ID,
          email: TEST_USER_EMAIL,
        },
      });

    // Owner deletes project_contents
    await firebase.assertSucceeds(
      ownerDb
        .collection(PROJECT_CONTENTS)
        .doc(TEST_PROJECT_CONTENTS_ID)
        .delete()
    );
  });

  it('Owner cannot update non-existent document', async () => {
    const ownerDb = authedApp({ uid: TEST_USER_ID, email_verified: true });

    // Owner deletes project_contents
    await firebase.assertFails(
      ownerDb
        .collection(PROJECT_CONTENTS)
        .doc(TEST_PROJECT_CONTENTS_ID)
        .update({ state: 'test2' })
    );
  });

  it('Add, Remove, and Resolve comments', async () => {
    const COMMENT_THREAD_ID = 'comment-thread';
    const COMMENT_ID = 'comment-id';
    const COMMENT_THREAD = 'Comment Thread';
    const COMMENT = 'Comment';

    const ownerDb = authedApp({ uid: TEST_USER_ID, email_verified: true });
    const userTwoDb = authedApp({ uid: TEST_USURPER_ID, email_verified: true });

    // Owner CREATES a Project
    await ownerDb
      .collection(PROJECTS)
      .doc(TEST_PROJECT_ID)
      .set({
        name: 'my project',
        numComments: 0,
        owner: {
          id: TEST_USER_ID,
          email: TEST_USER_EMAIL,
        },
      });

    // Owner CREATES a comment THREAD
    await firebase.assertSucceeds(
      ownerDb
        .collection(COMMENTS)
        .doc(COMMENT_THREAD_ID)
        .set({
          type: COMMENT_THREAD,
          projectId: TEST_PROJECT_ID,
          owner: {
            id: TEST_USER_ID,
            email: TEST_USER_EMAIL,
          },
        })
    );

    // Owner user CREATES a COMMENT
    await firebase.assertSucceeds(
      ownerDb
        .collection(COMMENTS)
        .doc(COMMENT_ID)
        .set({
          type: COMMENT,
          threadId: COMMENT_THREAD_ID,
          projectId: TEST_PROJECT_ID,
          owner: {
            id: TEST_USER_ID,
            email: TEST_USER_EMAIL,
          },
        })
    );

    // Owner user DELETES a COMMENT
    await firebase.assertSucceeds(
      ownerDb
        .collection(COMMENTS)
        .doc(COMMENT_ID)
        .delete()
    );

    // Another user CREATES a COMMENT on the User's COMMENT_THREAD
    await firebase.assertSucceeds(
      userTwoDb
        .collection(COMMENTS)
        .doc(COMMENT_ID)
        .set({
          type: COMMENT,
          text: 'My Comment',
          threadId: COMMENT_THREAD_ID,
          projectId: TEST_PROJECT_ID,
          owner: {
            id: TEST_USURPER_ID,
          },
        })
    );

    // Another user UPDATES previously created comment
    await firebase.assertSucceeds(
      userTwoDb
        .collection(COMMENTS)
        .doc(COMMENT_ID)
        .update({ text: 'Edited comment' })
    );

    // Another user DELETES a COMMENT
    await firebase.assertSucceeds(
      userTwoDb
        .collection(COMMENTS)
        .doc(COMMENT_ID)
        .delete()
    );

    // Owner DELETES a COMMENT THREAD
    await firebase.assertSucceeds(
      ownerDb
        .collection(COMMENTS)
        .doc(COMMENT_THREAD_ID)
        .delete()
    );

    // Another CREATES a COMMENT THREAD
    await firebase.assertSucceeds(
      userTwoDb
        .collection(COMMENTS)
        .doc(COMMENT_THREAD_ID)
        .set({
          type: COMMENT_THREAD,
          projectId: TEST_PROJECT_ID,
          owner: {
            id: TEST_USER_ID,
            email: TEST_USER_EMAIL,
          },
        })
    );

    // Owner CREATES a comment THREAD
    await firebase.assertSucceeds(
      ownerDb
        .collection(COMMENTS)
        .doc(COMMENT_THREAD_ID)
        .set({
          type: COMMENT_THREAD,
          projectId: TEST_PROJECT_ID,
          owner: {
            id: TEST_USER_ID,
            email: TEST_USER_EMAIL,
          },
        })
    );

    // Owner RESOLVES a comment THREAD
    await firebase.assertSucceeds(
      ownerDb
        .collection(COMMENTS)
        .doc(COMMENT_THREAD_ID)
        .update({ resolved: true })
    );

    // Owner CREATES a comment THREAD
    await firebase.assertSucceeds(
      ownerDb
        .collection(COMMENTS)
        .doc(COMMENT_THREAD_ID)
        .set({
          type: COMMENT_THREAD,
          projectId: TEST_PROJECT_ID,
          owner: {
            id: TEST_USER_ID,
            email: TEST_USER_EMAIL,
          },
        })
    );

    // Another RESOLVES a comment THREAD
    await firebase.assertSucceeds(
      userTwoDb
        .collection(COMMENTS)
        .doc(COMMENT_THREAD_ID)
        .update({ resolved: true })
    );
  });

  // CHANGELOG TESTING
  it('Admin creates a new changelog entry', async () => {
    const adminDb = authedApp({ uid: ADMIN_USER_ID, email_verified: true });

    // Admin creates a changelog entry
    await firebase.assertSucceeds(
      adminDb
        .collection(NEWS_UPDATES)
        .doc(TEST_CHANGELOG_ENTRY_ID)
        .set({
          title: 'Test Entry',
          date: {
            seconds: 1574323200,
            nanoseconds: 0,
          },
          details: 'Lorem ipsum sdflybfd dafly dfslb asdfdsaf asd',
        })
    );
  });

  it('Admin edits existing changelog entry', async () => {
    const adminDb = authedApp({ uid: ADMIN_USER_ID, email_verified: true });

    await adminDb
      .collection(NEWS_UPDATES)
      .doc(TEST_CHANGELOG_ENTRY_ID)
      .set({
        title: 'Test Entry',
        date: {
          seconds: 1574323200,
          nanoseconds: 0,
        },
        details: 'Lorem ipsum sdflybfd dafly dfslb asdfdsaf asd',
      });

    // Admin creates a changelog entry
    await firebase.assertSucceeds(
      adminDb
        .collection(NEWS_UPDATES)
        .doc(TEST_CHANGELOG_ENTRY_ID)
        .update({
          title: 'New Test Entry',
        })
    );
  });

  it('Admin deletes a changelog entry', async () => {
    const adminDb = authedApp({ uid: ADMIN_USER_ID, email_verified: true });

    await adminDb
      .collection(NEWS_UPDATES)
      .doc(TEST_CHANGELOG_ENTRY_ID)
      .set({
        title: 'Test Entry',
        date: {
          seconds: 1574323200,
          nanoseconds: 0,
        },
        details: 'Lorem ipsum sdflybfd dafly dfslb asdfdsaf asd',
      });

    // Admin creates a changelog entry
    await firebase.assertSucceeds(
      adminDb
        .collection(NEWS_UPDATES)
        .doc(TEST_CHANGELOG_ENTRY_ID)
        .delete()
    );
  });

  it('Non-admin cannot create a new changelog entry', async () => {
    const usurperDb = authedApp({ uid: TEST_USURPER_ID, email_verified: true });

    // Admin creates a changelog entry
    await firebase.assertFails(
      usurperDb
        .collection(NEWS_UPDATES)
        .doc(TEST_CHANGELOG_ENTRY_ID)
        .set({
          title: 'Test Entry',
          date: {
            seconds: 1574323200,
            nanoseconds: 0,
          },
          details: 'Lorem ipsum sdflybfd dafly dfslb asdfdsaf asd',
        })
    );
  });

  it('Non-admin cannot edit an existing changelog entry', async () => {
    const adminDb = authedApp({ uid: ADMIN_USER_ID, email_verified: true });
    const usurperDb = authedApp({ uid: TEST_USURPER_ID, email_verified: true });

    await adminDb
      .collection(NEWS_UPDATES)
      .doc(TEST_CHANGELOG_ENTRY_ID)
      .set({
        title: 'Test Entry',
        date: {
          seconds: 1574323200,
          nanoseconds: 0,
        },
        details: 'Lorem ipsum sdflybfd dafly dfslb asdfdsaf asd',
      });

    // Admin creates a changelog entry
    await firebase.assertFails(
      usurperDb
        .collection(NEWS_UPDATES)
        .doc(TEST_CHANGELOG_ENTRY_ID)
        .update({
          title: 'New Test Entry',
        })
    );
  });

  it('Non-admin cannot delete a changelog entry', async () => {
    const adminDb = authedApp({ uid: ADMIN_USER_ID, email_verified: true });
    const usurperDb = authedApp({ uid: TEST_USURPER_ID, email_verified: true });

    await adminDb
      .collection(NEWS_UPDATES)
      .doc(TEST_CHANGELOG_ENTRY_ID)
      .set({
        title: 'Test Entry',
        date: {
          seconds: 1574323200,
          nanoseconds: 0,
        },
        details: 'Lorem ipsum sdflybfd dafly dfslb asdfdsaf asd',
      });

    // Admin creates a changelog entry
    await firebase.assertFails(
      usurperDb
        .collection(NEWS_UPDATES)
        .doc(TEST_CHANGELOG_ENTRY_ID)
        .delete()
    );
  });
});
