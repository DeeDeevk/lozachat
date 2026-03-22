import { useEffect } from "react";
import { usePostStore } from "../stores/usePostStore";

export const useFeedPosts = () => {
  const store = usePostStore();

  useEffect(() => {
    store.fetchPosts(true);
  }, []);

  return store;
};