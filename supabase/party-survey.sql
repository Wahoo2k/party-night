-- Real answers typed in the survey games (Top Spot, Crowd Says), kept as counts only.
create table if not exists party.survey_answers (
  q text not null,
  answer text not null,
  hit smallint not null default -1,      -- which board answer it matched when it was last said; -1 = not on the board
  n integer not null default 1,          -- how many times it has been said
  first_day date not null default current_date,
  last_day date not null default current_date,
  primary key (q, answer)
);
alter table party.survey_answers enable row level security;   -- no policies: only the party function (server side) reads or writes
