FROM travisci/ci-nodejs

RUN su - travis

# Clone the travis-build repository in your builds directory and switch to it.
RUN cd ~/builds
RUN git clone https://github.com/travis-ci/travis-build.git
RUN cd travis-build
