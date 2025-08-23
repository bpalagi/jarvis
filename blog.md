# Corporate Kid Tries to Build FR

So I'm what at this point I'd describe as a classically trained corporate software engineer,
* I studied Computer Engineering at the University of Illinois, and have spent the first couple years of my career writing Java SpringBoot API's at a Fortune 500.

I've gotten frustrated with the slow moving, fairly boring work of maintaining a PostgresDB of emails.
* the pay is nice, I've got what I've always strived for, but I'm looking for more...
* I see there's still so much more to what can be done in software on Twitter

I'm also like addicted to YouTube and X dot com, the everything app
* so this is my attempt to weave these pieces together and explore areas of tech while I feel bottlenecked by beauracracy


## Let's get into it now, working on Jarvis

So something I don't feel I'm able to play with as much as I'd like in the Corporate setting is the newest AI coding tools.
* with enterprise data regulations, I'm personally limited to utilizing primarily the GitHub Copilot assistant for code generation.

Today I'll go over my experience tinkering with the freely available Gemini CLI on a project that I forked from Tech Twitter. I haven't exactly worked on Open Source Software before but hit me up if you're interested in contributing or trying it out

Essentially this app is trying to be an AI assistant that is more than a chatbot, listening to your audio, taking screenshots and providing insight in real time.

If you're a freak about Privacy, run it with local Whisper and LLM Models, this is just me exploring how we can utilizie these language models that are supposed to revolutionize the world

So far I've utilized Gemini to get me up to speed on the project, I essentially walked into a big codebase and am just trying to get a general flow of what's going on and what the structure is

Gemini has stripped the app down from attempting to be a YC product to just what I need it for, and helped me build out documentation and my general understanding of what's going on.

So now I'll show a basic flow of the app running, and my initial understanding of the technical details.

demo convo

Gemini has not only stripped down the service and ramped me up on the structure
* has resolved issues with conversation history, created the ask/guide rather than summary/followup workflow









summary and followup context still logged... just not displayed.

* where is the prompt still being told about an interview setting?
* how does the app determine "you" vs "them" in conversation? Is it just mic audio vs system audio
* Can update the shortcutService to assume Mac, no need to accept ctrl. Translate any comments that are not in English
    * still looking to strip this down to the minimum where I can.
* clean up the logging of unnessecary events like the mouse hovering over the non-web app UI


Would like change the conversation history tab on front end to be a live, interactive dashboard including transcription, summary, ask and guide functionality




Can still better understand js, ts, next, express, etc.














Now need to actually try utilizing the app to determine where to go next.

ask service, listen service, stt service, summary service...

so that's a basic overview, but as always, if you want to truly understand what's going on: read the source code!
* it's just a few hundred lines of typescript and shit... I've barely written typescript, but AI is here to walk you through it


Stay tuned for next time where I really put Gemini CLI to the test with adding new functionality, as well as build up my neovim setup...
* I've already had good success as previously the transcibed audio wasn't being included in the Cmd+Enter functionality
    * simply tinkering right now... no test cases written, no customer feedback, etc.
* I'm going to cover how to best mix neovim functionality like ripgrep on top of gemini functionality for finding how to edit source code as fast as possible
    * especially when you have little knowledge of the code base... AI tools are going to continue improving rapidly, but we I see engineers being in the loop still
    * at least for quite some time, so at least for now it's not just about the tools building software, but engineers ability to quickly validate generated software.
* man is it fun to just let the AI agent run without intervention, but as of now I feel understanding more than less of what the agent is changing allows for best results
    * what I mean is: read the output even if you're accepting all the changes
    * vibe with the code, don't just let the code vibe if you know what I mean... pump some edm and lock in


Wrapping up now with what my goal is with content is to practice articulating technical thoughts, both written and spoken. I definitely think it would be fun to grow an audience but know the reality is that's better to think of as a side effect rather than main goal with content. Podcasters always say that by posting content you are forced to analyze your work in a deeper way than even like a public speaking course, there's the inherent focus of dialing something in to where you believe it's worth posting. Well, this applies at least for longer form... I also just want something to shitpost on twitter about. follow along @TangLLC
