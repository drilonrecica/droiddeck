class Droiddeck < Formula
  desc "Terminal dashboard and CLI command center for native Android development"
  homepage "https://github.com/drilonrecica/droiddeck"
  url "https://github.com/drilonrecica/droiddeck/releases/download/v0.1.2/droiddeck-0.1.2.tgz"
  sha256 "bd68a439681baefca6440a32b8cbc8ab5bca191fbe5b34f81409f715b9fe2f73"
  license "MIT"

  depends_on "node" => :build
  depends_on "oven-sh/bun/bun"

  def install
    system "npm", "install", *std_npm_args
    bin.install_symlink libexec.glob("bin/*")
  end

  test do
    assert_match "Usage:", shell_output("#{bin}/droiddeck --help")
  end
end
