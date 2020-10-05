self.addEventListener('message', ({ data }) => {
	const reader = new FileReader();
	reader.addEventListener('load', ({ target: { result }}) => self.postMessage({
		dataUri: result,
		objectUrl: URL.createObjectURL(data.file),
	}));
	reader.readAsDataURL(data.file);
});

