type CommentItem = {
  id: number;
  authorName: string | null;
  body: string;
  createdAt: Date;
};

export default function CommentList({ comments }: { comments: CommentItem[] }) {
  if (comments.length === 0) {
    return <p className="text-sm text-muted">No comments yet.</p>;
  }

  return (
    <ul className="space-y-3">
      {comments.map((comment) => (
        <li
          key={comment.id}
          className="rounded-xl bg-card-muted p-4"
        >
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-sm font-medium text-ink">
              {comment.authorName ?? "Anonymous"}
            </span>
            <span className="text-xs text-faint">
              {comment.createdAt.toLocaleDateString()}
            </span>
          </div>
          <p className="mt-1 text-sm text-ink">{comment.body}</p>
        </li>
      ))}
    </ul>
  );
}
