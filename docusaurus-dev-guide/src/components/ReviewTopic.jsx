export function ReviewTopic({content="TODO: Review this topic if it is up to date"}) {
  return (
    <p
      style={{
        color: "white",
        fontWeight: "bold",
        borderRadius: "3px",
        backgroundColor: "#DF301C",
        padding: "4px",
      }}
    >
      {content}
    </p>
  );
}
