# What this project does

It's experimental code to get TensorflowJs AI library and models working with
React + Typescript + Vite.

## Demo
Since it's a static-only site with all the AI running in the client side javascript engine, there's a demo deployed here:

https://tomnusds.github.io/ai-camera/


## Working with some caveats.
- Builds and runs dev/deploy using external ai libraries.
- Static build requires no server-side.

## Not finished:
-  Uses a open source camera component (webcam-react ) that is a bit older. Attempted to update to work with typescript, but we should really rewrite. (See `_VideoCapturer.tsx`)
- CSS for mobile still needs work. Camera should shrink to fit and doesn't.
- Includes a new, generically useful "ShadowDom" component. This is used to isolate the video layout (with view-window, svg overlay, ai feedback overlays) into a competent that's style isolated from the rest of the site.
- ID scan should use some OCR text library but doesn't yet.
- Needs unit tests, but so much is changing/experimental that it may be overhead.
- Needs github actions like dependabot.

## React + TypeScript + Vite + TensorflowJs

```
yarn
yarn run dev
```

## Deploy

Merging `main` into `gh-pages` triggers a deploy.

### To add React Native support
https://js.tensorflow.org/api_react_native/1.0.0/
