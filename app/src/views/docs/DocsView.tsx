// File : /TeamSamsara.Workflow/app/src/views/docs/DocsView.tsx
// Version : 1.2.0
// Latest commit: feature/docs-refresh
// Author : Gerrah
// Purpose : Documentation: the articles for what your roles let you do, in
// groups, with a search; one article open beside the list, with "Show me in
// the app" to play its walkthrough chapter. People who manage the workspace
// can view it as any role sees it.

import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ManagePermissions,
  resolvePermissions,
  usePermissions,
} from "@/core/access";
import {
  DocPicture,
  docsFor,
  searchDocs,
  useWalkthrough,
  type Article,
  type Block,
  type DocGroup,
} from "@/features/onboarding";
import { Banner } from "@/shared/components/Banner/Banner";
import { Button } from "@/shared/components/Button/Button";
import { Select } from "@/shared/components/Fields/Select/Select";
import { TextField } from "@/shared/components/Fields/TextField/TextField";
import { PageHeader } from "@/shared/components/PageHeader/PageHeader";
import { docsPath } from "@/shared/constants/routePaths";
import { DocsViewText as Text } from "./docsViewContent";
import styles from "./DocsView.module.css";

function BlockView({ block }: { block: Block }) {
  switch (block.kind) {
    case "h":
      return <h3 className={styles.subheading}>{block.text}</h3>;
    case "p":
      return <p className={styles.text}>{block.text}</p>;
    case "steps":
      return (
        <ol className={styles.items}>
          {block.items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ol>
      );
    case "list":
      return (
        <ul className={styles.items}>
          {block.items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      );
    default:
      return <DocPicture block={block} />;
  }
}

export function DocsView() {
  const access = usePermissions();
  const walkthrough = useWalkthrough();
  const navigate = useNavigate();
  const { articleId } = useParams();
  const [search, setSearch] = useState("");
  const [viewAs, setViewAs] = useState("");

  const canViewAs = access.canAny(ManagePermissions);
  const roles = access.roles?.roles ?? [];
  const viewedRole = roles.find((role) => role.id === viewAs);
  const permissions =
    viewedRole && access.roles
      ? resolvePermissions([viewedRole.id], access.roles)
      : access.permissions;
  const groups = docsFor(permissions);
  const shown = searchDocs(groups, search);
  const all = groups.flatMap((group) =>
    group.articles.map((article) => ({ group, article })),
  );
  const open = articleId
    ? all.find((entry) => entry.article.id === articleId)
    : all[0];
  const nextEntry = open ? all[all.indexOf(open) + 1] : undefined;
  const myChapters = new Set(walkthrough.chapters.map((chapter) => chapter.id));

  return (
    <div className={styles.page}>
      <PageHeader
        title={Text.title}
        description={Text.description}
        actions={
          <Button iconStart="repeat" onClick={walkthrough.replay}>
            {Text.replay}
          </Button>
        }
      />
      <div className={styles.tools}>
        <TextField
          label={Text.search}
          hideLabel
          type="search"
          leadingIcon="search"
          placeholder={Text.searchPlaceholder}
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className={styles.search}
        />
        {canViewAs ? (
          <Select
            label={Text.viewAs}
            options={[
              { value: "", label: Text.me },
              ...roles.map((role) => ({ value: role.id, label: role.name })),
            ]}
            value={viewAs}
            onChange={(event) => setViewAs(event.target.value)}
            className={styles.viewAs}
          />
        ) : null}
      </div>
      {viewedRole ? (
        <Banner tone="info">{Text.viewAsNote(viewedRole.name)}</Banner>
      ) : null}

      <div className={styles.columns}>
        <nav aria-label={Text.articles} className={styles.list}>
          {shown.length === 0 ? (
            <p className={styles.muted}>{Text.noResults}</p>
          ) : null}
          {shown.map((group) => (
            <div key={group.id} className={styles.group}>
              <div className={styles.groupHead}>
                <h2 className={styles.groupTitle}>{group.title}</h2>
              </div>
              <ul className={styles.links}>
                {group.articles.map((article) => (
                  <li key={article.id}>
                    <Link
                      to={docsPath(article.id)}
                      className={styles.link}
                      aria-current={
                        open?.article.id === article.id ? "page" : undefined
                      }
                    >
                      {article.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        <article className={styles.article}>
          {open ? (
            <ArticleView
              group={open.group}
              article={open.article}
              canShow={
                !viewedRole &&
                Boolean(open.group.chapter) &&
                myChapters.has(open.group.chapter ?? "yours")
              }
              onShow={() =>
                open.group.chapter && walkthrough.start([open.group.chapter])
              }
              next={nextEntry?.article}
              onNext={() =>
                nextEntry && navigate(docsPath(nextEntry.article.id))
              }
            />
          ) : (
            <p className={styles.muted}>{Text.notFound}</p>
          )}
        </article>
      </div>
    </div>
  );
}

function ArticleView({
  group,
  article,
  canShow,
  onShow,
  next,
  onNext,
}: {
  group: DocGroup;
  article: Article;
  canShow: boolean;
  onShow: () => void;
  next: Article | undefined;
  onNext: () => void;
}) {
  return (
    <>
      <span className={styles.crumb}>{group.title}</span>
      <h2 className={styles.title}>{article.title}</h2>
      <span className={styles.who}>
        {group.requiresLabel
          ? Text.shownTo(group.requiresLabel)
          : Text.shownToAll}
      </span>
      {article.body.map((block, index) => (
        <BlockView key={index} block={block} />
      ))}
      <div className={styles.actions}>
        {canShow ? (
          <Button variant="primary" iconStart="next" onClick={onShow}>
            {Text.showMe}
          </Button>
        ) : null}
        {next ? (
          <Button variant="ghost" onClick={onNext}>
            {Text.next(next.title)}
          </Button>
        ) : null}
      </div>
    </>
  );
}
