type CommentItem = {
  id: number;
  authorName: string | null;
  body: string;
  createdAt: Date;
};

export default function CommentList({ comments }: { comments: CommentItem[] }) {
  if (comments.length === 0) {
    return <p className="text-sm text-stone-500 dark:text-stone-400">No comments yet.</p>;
  }

  return (
    <ul className="space-y-3">
      {comments.map((comment) => (
        <li
          key={comment.id}
          className="rounded-lg border border-stone-200 bg-white p-3 dark:border-stone-800 dark:bg-stone-900"
        >
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-sm font-medium text-stone-900 dark:text-stone-100">
              {comment.authorName ?? "Anonymous"}
            </span>
            <span className="text-xs text-stone-400 dark:text-stone-500">
              {comment.createdAt.toLocaleDateString()}
            </span>
          </div>
          <p className="mt-1 text-sm text-stone-700 dark:text-stone-300">{comment.body}</p>
        </li>
      ))}
    </ul>
  );
}
