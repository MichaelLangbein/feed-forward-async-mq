# Lessons learned

- Processes have those `WpsOptionInput`s. Why not have a fake-process that outputs all the options in such a `WpsOptionInput`?
- two identical messages can be sent close to each other, before the target-process has completed its calculations. This starts the process twice. 
  - Solved with a lock ... but can we do better?
