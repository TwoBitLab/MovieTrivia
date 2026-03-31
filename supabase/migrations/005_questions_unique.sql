-- Unique constraint used by seeding scripts for idempotent upserts.
-- (source, prompt, correct_answer) covers all question types including
-- image_id which shares a generic prompt across many movies.
alter table public.questions
  add constraint questions_source_prompt_answer_unique
  unique (source, prompt, correct_answer);
