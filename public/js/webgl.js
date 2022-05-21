window.addEventListener("load", function () {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
    if (!(gl instanceof WebGLRenderingContext)) {
        this.alert("It seems your browser doesn't support WebGL!\nI'm sorry you may not be able view this website. A non-WebGL version is in development.");
        setCookie("no_3d", 1);
        this.location.reload(true);
    }
}, false);