import { expect, test, type BrowserContext, type Page, type Route } from "@playwright/test";

const baseUrl = "http://localhost:5173";

type Participant = {
  id: string;
  name: string;
  isHost: boolean;
};

type Estimate = {
  participantId: string;
  value: string;
};

type Session = {
  id: string;
  code: string;
  storyTitle: string;
  storyContext: string;
  participants: Participant[];
  estimates: Estimate[];
  revealed: boolean;
};

type MockState = {
  sessions: Record<string, Session>;
  nextSessionId: number;
  nextParticipantId: number;
};

function createMockState(): MockState {
  return {
    sessions: {},
    nextSessionId: 1,
    nextParticipantId: 1,
  };
}

function findSessionByCode(state: MockState, code: string) {
  return Object.values(state.sessions).find(
    (session) => session.code.toUpperCase() === code.toUpperCase()
  );
}

function getSessionByIdOrFirst(state: MockState, sessionId?: string) {
  if (sessionId && state.sessions[sessionId]) {
    return state.sessions[sessionId];
  }

  return Object.values(state.sessions)[0] ?? null;
}

function toPublicSession(session: Session | null) {
  if (!session) {
    return null;
  }

  return {
    id: session.id,
    code: session.code,
    storyTitle: session.storyTitle,
    storyContext: session.storyContext,
    revealed: session.revealed,
    participants: session.participants,
    estimates: session.participants.map((participant) => {
      const estimate = session.estimates.find(
        (item) => item.participantId === participant.id
      );

      return {
        participantId: participant.id,
        participantName: participant.name,
        hasVoted: Boolean(estimate),
        value: session.revealed ? estimate?.value ?? null : null,
      };
    }),
  };
}

async function installGraphqlMock(context: BrowserContext, state: MockState) {
  await context.route("**/graphql", async (route: Route) => {
    const request = route.request();
    const postData = request.postData() ?? "";

    let body: any = {};
    try {
      body = JSON.parse(postData || "{}");
    } catch {
      await route.fulfill({
        status: 400,
        contentType: "application/json",
        body: JSON.stringify({ errors: [{ message: "Invalid JSON" }] }),
      });
      return;
    }

    const operationName = body.operationName ?? "";
    const variables = body.variables ?? {};

    const operationMatches = (name: string) =>
      operationName === name || postData.includes(name);

    if (operationMatches("CreateSession") || postData.includes("createSession")) {
      const name = String(variables.name || "Host").trim();
      const sessionId = `s-${state.nextSessionId++}`;
      const participantId = `u-${state.nextParticipantId++}`;
      const code = `S${String(state.nextSessionId).padStart(4, "0")}`;

      const session: Session = {
        id: sessionId,
        code,
        storyTitle: "",
        storyContext: "",
        participants: [
          {
            id: participantId,
            name,
            isHost: true,
          },
        ],
        estimates: [],
        revealed: false,
      };

      state.sessions[sessionId] = session;

      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          data: {
            createSession: {
              session: toPublicSession(session),
              participant: {
                id: participantId,
                name,
                isHost: true,
              },
            },
          },
        }),
      });
      return;
    }

    if (operationMatches("JoinSession") || postData.includes("joinSession")) {
      const code = String(variables.code || "").trim().toUpperCase();
      const name = String(variables.name || "Guest").trim();
      const session = findSessionByCode(state, code);

      if (!session) {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            errors: [{ message: "Session not found" }],
          }),
        });
        return;
      }

      const participantId = `u-${state.nextParticipantId++}`;

      const participant: Participant = {
        id: participantId,
        name,
        isHost: false,
      };

      session.participants.push(participant);

      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          data: {
            joinSession: {
              session: toPublicSession(session),
              participant,
            },
          },
        }),
      });
      return;
    }

    if (operationMatches("GetSession") || postData.includes("getSession")) {
      const session = getSessionByIdOrFirst(state, variables.id ?? variables.sessionId);

      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          data: {
            getSession: toPublicSession(session),
          },
        }),
      });
      return;
    }

    if (operationMatches("SetStoryTitle") || postData.includes("setStoryTitle")) {
      const session = getSessionByIdOrFirst(state, variables.sessionId);
      if (session) {
        session.storyTitle = String(variables.title || "").trim();
      }

      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          data: {
            setStoryTitle: toPublicSession(session),
          },
        }),
      });
      return;
    }

    if (
      operationMatches("SaveStoryContext") ||
      postData.includes("saveStoryContext") ||
      postData.includes("setStoryContext")
    ) {
      const session = getSessionByIdOrFirst(state, variables.sessionId);
      if (session) {
        session.storyContext = String(
          variables.context ?? variables.storyContext ?? ""
        ).trim();
      }

      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          data: {
            saveStoryContext: toPublicSession(session),
          },
        }),
      });
      return;
    }

    if (operationMatches("SubmitEstimate") || postData.includes("submitEstimate")) {
      const session = getSessionByIdOrFirst(state, variables.sessionId);
      const participantId = String(variables.participantId || "");
      const value = String(variables.value || "");

      if (session) {
        const existingEstimate = session.estimates.find(
          (estimate) => estimate.participantId === participantId
        );

        if (existingEstimate) {
          existingEstimate.value = value;
        } else {
          session.estimates.push({ participantId, value });
        }
      }

      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          data: {
            submitEstimate: toPublicSession(session),
          },
        }),
      });
      return;
    }

    if (operationMatches("RevealVotes") || postData.includes("revealVotes")) {
      const session = getSessionByIdOrFirst(state, variables.sessionId);
      if (session) {
        session.revealed = true;
      }

      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          data: {
            revealVotes: toPublicSession(session),
          },
        }),
      });
      return;
    }

    if (operationMatches("ResetEstimates") || postData.includes("resetEstimates")) {
      const session = getSessionByIdOrFirst(state, variables.sessionId);
      if (session) {
        session.estimates = [];
        session.revealed = false;
      }

      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          data: {
            resetEstimates: toPublicSession(session),
          },
        }),
      });
      return;
    }

    await route.fulfill({
      status: 500,
      contentType: "application/json",
      body: JSON.stringify({
        errors: [{ message: `Unhandled GraphQL operation: ${operationName}` }],
      }),
    });
  });
}

async function createSession(page: Page, name = "Host") {
  await page.goto(baseUrl);

  await page.getByLabel(/your name/i).first().fill(name);
  await page.getByRole("button", { name: /start session/i }).click();

  await expect(page).toHaveURL(/\/session\//);

  const url = new URL(page.url());
  const code = url.pathname.split("/").at(-1);

  expect(code).toBeTruthy();

  return code as string;
}

async function joinSession(page: Page, code: string, name = "User2") {
  await page.goto(baseUrl);

  const nameInputs = page.getByLabel(/your name/i);
  await nameInputs.nth(1).fill(name);

  await page.getByLabel(/session code/i).fill(code);
  await page.getByRole("button", { name: /join session/i }).click();

  await expect(page).toHaveURL(new RegExp(`/session/${code}`));
}

test.describe("Homepage", () => {
  test("shows the two main actions", async ({ browser }) => {
    const state = createMockState();
    const context = await browser.newContext();
    await installGraphqlMock(context, state);

    const page = await context.newPage();
    await page.goto(baseUrl);

    await expect(
      page.getByRole("heading", { name: /start a session/i })
    ).toBeVisible();

    await expect(
      page.getByRole("heading", { name: /join a session/i })
    ).toBeVisible();
  });  
 });