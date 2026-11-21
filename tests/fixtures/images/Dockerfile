FROM debian:trixie-slim@sha256:a72b4433de1cf7d6bae0c4cee74d0547f58601a643b3375f070c51600d63b6b2

# renovate: datasource=go depName=golang.org/x/text
ARG GOLANG_X_TEXT_VERSION=v0.44.0

# renovate: datasource=github-releases depName=kubernetes-sigs/kustomize extractVersion=^kustomize/(?<version>.+)$
ARG KUSTOMIZE_VERSION=v5.8.1

# renovate: datasource=github-releases depName=jqlang/jq extractVersion=^jq-(?<version>.+)$
ARG JQ_VERSION=1.7.1

USER 65532:65532
HEALTHCHECK NONE
